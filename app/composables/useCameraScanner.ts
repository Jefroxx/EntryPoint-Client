export type CameraState = 'idle' | 'starting' | 'live' | 'blocked' | 'nocamera' | 'unsupported'

// Browsers with a built-in BarcodeDetector (Chrome and Edge on Android, macOS and ChromeOS) need
// nothing extra. Windows, Safari and Firefox have none, so this small decoder is imported on demand
// — bundled, not fetched from a CDN, so a front desk with no internet still scans.

/** The on-screen target, as fractions of the <video> element's box (what the librarian sees). */
export interface ScanRegion {
  left: number
  top: number
  width: number
  height: number
}

/** Decode a little beyond the drawn frame, so a barcode just touching its edge (and its quiet zone) still reads. */
const REGION_MARGIN = 0.12
/** Every Nth pass also looks at the whole picture, for an ID held outside the frame. */
const FULL_FRAME_EVERY = 4
const TICK_MS = 100
/** Upscaled crops are capped at this width, which keeps a pass well under the tick on a desk PC. */
const MAX_CROP_WIDTH = 1600

/**
 * Reads Code 128 barcodes from the webcam or a phone camera. Every read is handed to `onCode`;
 * the same code seen again within a couple of seconds is ignored so one ID is never reported twice.
 * The <video> element is wired up through the returned `video` ref.
 *
 * Decoding looks at the part of the picture inside the on-screen frame (`region`), not the whole
 * camera image: a barcode that fills the frame gets every pixel the camera has to offer, and the room
 * behind it isn't there to confuse the decoder. That crop is decoded carefully (ZXing's TRY_HARDER,
 * with two binarizers), which matters on Windows, where there's no built-in BarcodeDetector.
 */
export function useCameraScanner(onCode: (code: string) => void, region?: () => ScanRegion) {
  const video = ref<HTMLVideoElement | null>(null)
  const state = ref<CameraState>('idle')
  const facing = ref<'environment' | 'user'>('environment')
  const torchAvailable = ref(false)
  const torchOn = ref(false)

  let stream: MediaStream | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let wakeLock: any = null
  let session = 0 // bumped by stop(), so slow async work from an old session can't act
  let last = { code: '', at: 0 }

  function emit(code: string) {
    const now = Date.now()
    if (code === last.code && now - last.at < 2500) return
    last = { code, at: now }
    onCode(code)
  }

  const canvas = import.meta.client ? document.createElement('canvas') : null
  const context = canvas?.getContext('2d', { willReadFrequently: true }) ?? null

  /**
   * Copies the part of the camera image under the on-screen frame onto the canvas. The <video> is drawn
   * with object-fit: cover, so the element's box is mapped back into the camera's own pixels first.
   */
  function grab(el: HTMLVideoElement, whole: boolean): HTMLCanvasElement | null {
    const vw = el.videoWidth
    const vh = el.videoHeight
    if (!canvas || !context || !vw || !vh) return null

    let sx = 0
    let sy = 0
    let sw = vw
    let sh = vh

    const r = whole ? null : region?.()
    if (r) {
      const ew = el.clientWidth || vw
      const eh = el.clientHeight || vh
      const scale = Math.max(ew / vw, eh / vh)
      const offsetX = (vw * scale - ew) / 2
      const offsetY = (vh * scale - eh) / 2

      const left = Math.max(0, r.left - r.width * REGION_MARGIN)
      const top = Math.max(0, r.top - r.height * REGION_MARGIN)
      const right = Math.min(1, r.left + r.width * (1 + REGION_MARGIN))
      const bottom = Math.min(1, r.top + r.height * (1 + REGION_MARGIN))

      sx = Math.max(0, (left * ew + offsetX) / scale)
      sy = Math.max(0, (top * eh + offsetY) / scale)
      sw = Math.min(vw - sx, ((right - left) * ew) / scale)
      sh = Math.min(vh - sy, ((bottom - top) * eh) / scale)
    }

    // The crop is widened up to 2× (smoothed): thin bars then span several pixels, which the sharpening
    // pass needs. Only across the bars; stretching their height adds nothing. The whole picture isn't scaled.
    const upscale = whole ? 1 : Math.max(1, Math.min(2, MAX_CROP_WIDTH / sw))
    canvas.width = Math.round(sw * upscale)
    canvas.height = Math.round(sh)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  /** The canvas as one brightness value per pixel, the form the decoder reads. */
  function luminance(frame: HTMLCanvasElement): { data: Uint8ClampedArray; w: number; h: number } {
    const { width: w, height: h } = frame
    const rgba = context!.getImageData(0, 0, w, h).data
    const data = new Uint8ClampedArray(w * h)
    for (let i = 0, p = 0; i < data.length; i++, p += 4) data[i] = (rgba[p]! * 77 + rgba[p + 1]! * 150 + rgba[p + 2]! * 29) >> 8
    return { data, w, h }
  }

  /**
   * Rescues soft or noisy frames (a webcam that can't focus close, a photo of a phone screen): averages each
   * column over a few rows to wash out noise, sharpens across the bars (unsharp mask), and stretches each
   * row's contrast to full black-to-white. On test frames this took reads of a slightly blurred barcode
   * from 0 of 6 to 6 of 6.
   */
  function enhance({ data, w, h }: { data: Uint8ClampedArray; w: number; h: number }) {
    const ROWS = 7
    const RADIUS = 3
    const AMOUNT = 1.5

    const smooth = new Float32Array(w * h)
    for (let x = 0; x < w; x++) {
      // Running sum down the column: O(h) per column instead of O(h × window).
      let sum = 0
      let n = 0
      for (let y = 0; y < Math.min(h, ROWS + 1); y++) { sum += data[y * w + x]!; n++ }
      for (let y = 0; y < h; y++) {
        smooth[y * w + x] = sum / n
        const add = y + ROWS + 1
        const drop = y - ROWS
        if (add < h) { sum += data[add * w + x]!; n++ }
        if (drop >= 0) { sum -= data[drop * w + x]!; n-- }
      }
    }

    const out = new Uint8ClampedArray(w * h)
    const row = new Float32Array(w)
    for (let y = 0; y < h; y++) {
      const base = y * w
      let sum = 0
      let n = 0
      for (let x = 0; x < Math.min(w, RADIUS + 1); x++) { sum += smooth[base + x]!; n++ }
      let lo = Infinity
      let hi = -Infinity
      for (let x = 0; x < w; x++) {
        const v = smooth[base + x]! + AMOUNT * (smooth[base + x]! - sum / n)
        row[x] = v
        if (v < lo) lo = v
        if (v > hi) hi = v
        const add = x + RADIUS + 1
        const drop = x - RADIUS
        if (add < w) { sum += smooth[base + add]!; n++ }
        if (drop >= 0) { sum -= smooth[base + drop]!; n-- }
      }
      const span = Math.max(1, hi - lo)
      for (let x = 0; x < w; x++) out[base + x] = ((row[x]! - lo) / span) * 255
    }
    return { data: out, w, h }
  }

  async function beginDecoding(mine: number) {
    let pass = 0

    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['code_128'] })

      const tick = async () => {
        if (mine !== session || !video.value) return
        try {
          const whole = ++pass % FULL_FRAME_EVERY === 0
          const frame = grab(video.value, whole)
          let found = frame ? await detector.detect(frame) : []
          // Nothing in the plain crop: try it again sharpened (see enhance()).
          if (frame && !whole && !found[0]?.rawValue) {
            const sharp = enhance(luminance(frame))
            const rgba = new Uint8ClampedArray(sharp.w * sharp.h * 4)
            for (let i = 0, p = 0; i < sharp.data.length; i++, p += 4) {
              rgba[p] = rgba[p + 1] = rgba[p + 2] = sharp.data[i]!
              rgba[p + 3] = 255
            }
            found = await detector.detect(new ImageData(rgba, sharp.w, sharp.h))
          }
          if (found[0]?.rawValue) emit(found[0].rawValue)
        } catch {
          // The frame isn't ready yet; try again on the next tick.
        }
        timer = setTimeout(tick, TICK_MS)
      }

      void tick()
      return
    }

    let ZXing: any
    try {
      ZXing = await import('@zxing/library')
    } catch {
      throw Object.assign(new Error('decoder'), { name: 'DecoderError' })
    }
    if (mine !== session || !video.value || !stream) return

    // TRY_HARDER scans many more rows of the image and tolerates blur and uneven light; affordable because
    // it only runs on the frame's crop. The whole-picture fallback pass stays on the quick setting.
    const careful = new ZXing.MultiFormatReader()
    careful.setHints(new Map<any, any>([
      [ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.CODE_128]],
      [ZXing.DecodeHintType.TRY_HARDER, true],
    ]))
    const quick = new ZXing.MultiFormatReader()
    quick.setHints(new Map<any, any>([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.CODE_128]]]))

    const decode = (reader: any, image: { data: Uint8ClampedArray; w: number; h: number }, Binarizer: any): string | null => {
      try {
        // One byte per pixel, so ZXing takes the values as brightness directly.
        const source = new ZXing.RGBLuminanceSource(image.data, image.w, image.h)
        return reader.decode(new ZXing.BinaryBitmap(new Binarizer(source))).getText()
      } catch {
        return null
      } finally {
        reader.reset()
      }
    }

    // Hybrid copes with glare and shadows (a phone screen, a lamp); the global one with blur
    // (a webcam that can't focus close). Each rescues reads the other misses.
    const attempt = (reader: any, image: { data: Uint8ClampedArray; w: number; h: number }) =>
      decode(reader, image, ZXing.HybridBinarizer) ?? decode(reader, image, ZXing.GlobalHistogramBinarizer)

    const tick = () => {
      if (mine !== session || !video.value) return
      const whole = ++pass % FULL_FRAME_EVERY === 0
      const frame = grab(video.value, whole)
      if (frame) {
        try {
          const image = luminance(frame)
          const text = whole
            ? attempt(quick, image)
            : attempt(careful, image) ?? attempt(careful, enhance(image))
          if (text) emit(text)
        } catch {
          // An empty or odd-sized frame while the camera settles; the next tick tries again.
        }
      }
      timer = setTimeout(tick, TICK_MS)
    }

    tick()
  }

  function release() {
    session++
    clearTimeout(timer)
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    if (video.value) video.value.srcObject = null
    try { wakeLock?.release() } catch { /* not held */ }
    wakeLock = null
    torchOn.value = false
    torchAvailable.value = false
  }

  function stop() {
    release()
    state.value = 'idle'
  }

  async function start() {
    release()
    const mine = session

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      state.value = 'unsupported'
      return
    }

    state.value = 'starting'

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing.value }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      if (mine !== session) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const el = video.value
      if (!el) throw new Error('no video element')
      el.srcObject = stream
      await el.play()

      const track = stream.getVideoTracks()[0]
      torchAvailable.value = !!(track?.getCapabilities?.() as any)?.torch
      state.value = 'live'

      await beginDecoding(mine)
      try { wakeLock = await (navigator as any).wakeLock?.request('screen') } catch { /* optional */ }
    } catch (error: any) {
      if (mine !== session) return
      release()
      state.value = error?.name === 'DecoderError' ? 'unsupported'
        : error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError' ? 'nocamera'
          : 'blocked'
    }
  }

  async function flip() {
    facing.value = facing.value === 'environment' ? 'user' : 'environment'
    await start()
  }

  async function toggleTorch() {
    const track = stream?.getVideoTracks()[0]
    if (!track || !torchAvailable.value) return

    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn.value } as any] })
      torchOn.value = !torchOn.value
    } catch {
      torchAvailable.value = false
    }
  }

  onBeforeUnmount(stop)

  return { video, state, facing, torchAvailable, torchOn, start, stop, flip, toggleTorch }
}
