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
/**
 * Software autofocus (books only, see armAutofocus): how long the camera's own autofocus gets before the scanner takes
 * over, how long the lens is given to move to each trial position, how many positions the first pass tries across the
 * camera's range, and how long the sharpest one is held (with nothing read) before searching again.
 */
const FOCUS_AFTER_MS = 1500
const FOCUS_SETTLE_MS = 300
const FOCUS_COARSE_STEPS = 10
const FOCUS_HOLD_MS = 6000
/** Upscaled crops are capped at this width, which keeps a pass well under the tick on a desk PC. */
const MAX_CROP_WIDTH = 1600

export interface ScannerOptions {
  /**
   * Which barcodes to read. 'code128' (the default) is the library's own labels, IDs and slips; 'isbn' is the
   * EAN-13 barcode on the back of a book; 'any' reads both (a phone, which doesn't know what the desk wants).
   */
  formats?: 'code128' | 'isbn' | 'any'
  /** Reads this returns false for are dropped before they are reported or counted as "seen". */
  accept?: (code: string) => boolean
  /** Called when `accept` turned a read down, so the screen can say "I see a barcode, but it isn't the one I need". */
  onRejected?: (code: string) => void
}

/**
 * Reads barcodes (Code 128 by default, see `options.formats`) from the webcam or a phone camera. Every read is handed to `onCode`;
 * the same code seen again within a couple of seconds is ignored so one ID is never reported twice.
 * The <video> element is wired up through the returned `video` ref.
 *
 * Decoding looks at the part of the picture inside the on-screen frame (`region`), not the whole
 * camera image: a barcode that fills the frame gets every pixel the camera has to offer, and the room
 * behind it isn't there to confuse the decoder. That crop is decoded carefully (ZXing's TRY_HARDER,
 * with two binarizers), which matters on Windows, where there's no built-in BarcodeDetector.
 */
export function useCameraScanner(onCode: (code: string) => void, region?: () => ScanRegion, options: ScannerOptions = {}) {
  const formats = options.formats ?? 'code128'
  // The browser's detector and ZXing name the same symbologies differently.
  const detectorFormats = formats === 'isbn' ? ['ean_13'] : formats === 'any' ? ['code_128', 'ean_13'] : ['code_128']
  const zxingFormats = (ZXing: any) =>
    formats === 'isbn' ? [ZXing.BarcodeFormat.EAN_13]
      : formats === 'any' ? [ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.EAN_13]
        : [ZXing.BarcodeFormat.CODE_128]
  const video = ref<HTMLVideoElement | null>(null)
  const state = ref<CameraState>('idle')
  const facing = ref<'environment' | 'user'>('environment')
  const torchAvailable = ref(false)
  const torchOn = ref(false)
  /** 'seeking' while the scanner is searching for the sharpest focus, 'locked' once it has found it (see armAutofocus). */
  const focusPhase = ref<'off' | 'seeking' | 'locked'>('off')

  let stream: MediaStream | null = null
  let focusRun = 0 // bumped to cancel a running autofocus search
  let timer: ReturnType<typeof setTimeout> | undefined
  let wakeLock: any = null
  let session = 0 // bumped by stop(), so slow async work from an old session can't act
  let last = { code: '', at: 0 }
  // The camera track and what it can do, kept so the station's autofocus can start over after each read.
  let focusTrack: MediaStreamTrack | undefined
  let focusCaps: any = null

  // A code held steadily in front of the camera is reported once. The quiet period counts from the last time the code
  // was SEEN (not the last time it was reported), so it re-arms only after it has been out of view for 2.5 seconds.
  // Counting from the report made a held ID report itself every 2.5 seconds, and each one could flip a student in or out.
  function emit(code: string) {
    if (options.accept && !options.accept(code)) {
      options.onRejected?.(code)
      return
    }
    const now = Date.now()
    const repeat = code === last.code && now - last.at < 2500
    last = { code, at: now }
    if (repeat) return
    stopFocus()
    // The station reads one ID after another: its autofocus starts over for the next one (a book's stops at its read).
    if (formats !== 'isbn' && focusTrack) {
      const track = focusTrack
      try { void track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => {}) } catch { /* fixed focus */ }
      armAutofocus(track, focusCaps, session, true)
    }
    onCode(code)
  }

  /**
   * Software autofocus (books, and the scan station: see the station part below). A laptop webcam's own autofocus often settles on the room behind a barcode held
   * close, and a barcode only a little out of focus reads as grey bars that cannot be decoded. So when nothing has been
   * read after a moment, the scanner does the camera's job itself: it measures how sharp the picture inside the scan
   * frame is at each focus position across the camera's range, goes back to the sharpest, holds it while the book is
   * held still, and searches again as soon as the picture goes soft or after a while with no read.
   * Only where the camera allows manual focus; one that refuses is handed back to its own autofocus.
   */
  function armAutofocus(track: MediaStreamTrack | undefined, caps: any, mine: number, afterRead = false) {
    stopFocus()
    focusTrack = track
    focusCaps = caps
    if (!track) return
    const range = caps?.focusDistance
    if (!caps?.focusMode?.includes?.('manual') || typeof range?.min !== 'number' || typeof range?.max !== 'number' || range.max <= range.min) return

    const run = ++focusRun
    const alive = () => mine === session && run === focusRun
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
    const clamp = (distance: number) => Math.round(Math.min(range.max, Math.max(range.min, distance)))

    const setFocus = async (distance: number) => {
      await track.applyConstraints({ advanced: [{ focusMode: 'manual', focusDistance: distance } as any] })
      await sleep(FOCUS_SETTLE_MS)
    }
    // Two looks, a moment apart, so one noisy frame doesn't pick the position.
    const measure = async () => {
      let sum = 0
      for (let i = 0; i < 2 && alive(); i++) {
        sum += focusScore()
        await sleep(60)
      }
      return sum / 2
    }

    // Steps the lens across its range and settles on the sharpest position inside the scan frame.
    const search = async () => {
      focusPhase.value = 'seeking'
      const step = (range.max - range.min) / (FOCUS_COARSE_STEPS - 1)
      let best = { at: range.min, score: -1 }

      for (let i = 0; i < FOCUS_COARSE_STEPS && alive(); i++) {
        const at = clamp(range.min + step * i)
        await setFocus(at)
        const score = await measure()
        if (score > best.score) best = { at, score }
      }

      // Finer: just either side of the best coarse position.
      for (const at of [clamp(best.at - step / 2), clamp(best.at + step / 2)]) {
        if (!alive()) break
        await setFocus(at)
        const score = await measure()
        if (score > best.score) best = { at, score }
      }

      if (alive()) {
        await setFocus(best.at)
        focusPhase.value = 'locked'
      }
      return best
    }
    const handBack = async () => {
      focusPhase.value = 'off'
      try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }) } catch { /* fixed focus */ }
    }

    /*
     * The scan station (IDs, receipts, slips, book labels): scanning all day, and idle most of it. A laptop webcam's own
     * autofocus settles on the room behind an ID held up close, and slightly soft bars look fine to a person but don't
     * decode. So once something has been held in the frame for a moment without a read, the scanner focuses on it itself,
     * holds that while it stays, and hands focus back when it goes. It searches only when something is there (an empty
     * desk never makes the lens hunt), only once for the same thing (a busy background that never reads can't keep it
     * hunting either), and again for the next person after every read.
     */
    if (formats !== 'isbn') {
      void (async () => {
        try {
          // After a read, the code that was just read is still in view: it doesn't need a search.
          let searchedAt: number | null = afterRead ? seen.strength : null
          let emptySince = 0
          while (alive()) {
            await sleep(200)
            const now = Date.now()
            const there = !!seen.since && now - seen.at < 600
            // An empty frame for a second: whatever comes next is new, even if it looks much the same.
            if (!there) {
              emptySince ||= now
              if (now - emptySince > 1000) searchedAt = null
              continue
            }
            emptySince = 0
            const changed = searchedAt === null || Math.abs(seen.strength - searchedAt) > 0.3 * Math.max(seen.strength, searchedAt)
            if (now - seen.since < FOCUS_AFTER_MS || !changed) continue

            const best = await search()
            searchedAt = seen.strength
            // Hold while it stays in the frame and stays sharp, then give the camera its own focus back.
            const heldFrom = Date.now()
            let soft = 0
            while (alive() && seen.since && Date.now() - heldFrom < FOCUS_HOLD_MS && soft < 2) {
              await sleep(450)
              soft = (await measure()) < best.score * 0.65 ? soft + 1 : 0
            }
            if (alive()) await handBack()
          }
        } catch {
          if (run === focusRun) { stopFocus(); void handBack() }
        }
      })()
      return
    }

    void (async () => {
      try {
        await sleep(FOCUS_AFTER_MS)

        while (alive()) {
          const best = await search()
          if (!alive()) return

          // Hold the sharpest position while the book is held still. Search again when the picture goes soft twice
          // running (the book moved), or when the hold runs out without a read.
          const heldFrom = Date.now()
          let soft = 0
          while (alive() && Date.now() - heldFrom < FOCUS_HOLD_MS && soft < 2) {
            await sleep(450)
            const score = await measure()
            soft = score < best.score * 0.65 ? soft + 1 : 0
          }
        }
      } catch {
        // This camera won't take manual focus: give it back to its own autofocus.
        if (run === focusRun) {
          stopFocus()
          try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }) } catch { /* nothing more to do */ }
        }
      }
    })()
  }

  function stopFocus() {
    focusRun++
    focusPhase.value = 'off'
  }

  const canvas = import.meta.client ? document.createElement('canvas') : null
  const context = canvas?.getContext('2d', { willReadFrequently: true }) ?? null

  /**
   * The part of the camera picture under the on-screen frame (or all of it), in the camera's own pixels. The <video> is
   * drawn with object-fit: cover, so the element's box is mapped back into the camera's pixels first.
   */
  function cropRect(el: HTMLVideoElement, whole: boolean) {
    const vw = el.videoWidth
    const vh = el.videoHeight

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

    return { sx, sy, sw, sh }
  }

  const focusCanvas = import.meta.client ? document.createElement('canvas') : null
  const focusContext = focusCanvas?.getContext('2d', { willReadFrequently: true }) ?? null

  /**
   * How sharp the picture inside the scan frame is right now: the average change between neighbouring pixels along the
   * middle rows, at the camera's own resolution (shrinking the picture would hide exactly the fine detail that focus
   * changes). A blurred barcode has soft edges, so this is low; in focus, it is high.
   */
  function focusScore(): number {
    const el = video.value
    if (!el || !focusCanvas || !focusContext || !el.videoWidth || !el.videoHeight) return 0

    const { sx, sy, sw, sh } = cropRect(el, false)
    const w = Math.max(2, Math.round(sw))
    const h = Math.max(2, Math.round(sh * 0.3))
    focusCanvas.width = w
    focusCanvas.height = h
    focusContext.drawImage(el, sx, sy + sh * 0.35, sw, sh * 0.3, 0, 0, w, h)

    const data = focusContext.getImageData(0, 0, w, h).data
    let sum = 0
    let count = 0
    for (let y = 0; y < h; y += 2) {
      for (let x = 1; x < w; x++) {
        const p = (y * w + x) * 4
        sum += Math.abs(data[p + 1]! - data[p - 3]!)
        count++
      }
    }
    return count ? sum / count : 0
  }

  /** Copies the part of the camera image under the on-screen frame onto the canvas, ready to decode. */
  function grab(el: HTMLVideoElement, whole: boolean, scaleUp = true): HTMLCanvasElement | null {
    const vw = el.videoWidth
    const vh = el.videoHeight
    if (!canvas || !context || !vw || !vh) return null

    const { sx, sy, sw, sh } = cropRect(el, whole)

    // The crop is widened up to 2× (smoothed): thin bars then span several pixels, which the sharpening
    // pass needs. Only across the bars; stretching their height adds nothing. The whole picture isn't scaled.
    // (Not when the crop is levelled first: stretching one way would bend the angle it measures; see level().)
    const upscale = whole || !scaleUp ? 1 : Math.max(1, Math.min(2, MAX_CROP_WIDTH / sw))
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
  function enhance({ data, w, h }: { data: Uint8ClampedArray; w: number; h: number }, ROWS = 7, RADIUS = 3, AMOUNT = 1.5) {
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

  type Gray = { data: Uint8ClampedArray; w: number; h: number }

  /**
   * What is in the scan frame, from its edges: `strength` is the share of the picture that is a real edge (an empty desk
   * is ~0, any barcode held up 0.09 or more), `angle` the direction the bars lean (0 when level). One pass over every
   * other pixel; it feeds both the levelling below and the station's autofocus (it only searches when something is there).
   */
  function measureShape({ data, w, h }: Gray) {
    let sxx = 0
    let syy = 0
    let sxy = 0
    let edges = 0
    let n = 0
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        n++
        const gx = data[y * w + x + 1]! - data[y * w + x - 1]!
        const gy = data[(y + 1) * w + x]! - data[(y - 1) * w + x]!
        if (gx * gx + gy * gy < 400) continue
        edges++
        sxx += gx * gx
        syy += gy * gy
        sxy += gx * gy
      }
    }
    return { strength: n ? edges / n : 0, angle: 0.5 * Math.atan2(2 * sxy, sxx - syy) }
  }

  /**
   * A barcode held at a slant is turned level before decoding. The decoder reads straight across the picture, so a code
   * tilted ~15° (a phone held casually) crossed no single line of it and was never read. On the test bench (Code 128 IDs
   * on a filmed phone screen, blurred, tilted, small) levelling took reads from 15% to 27%, and tilted ones from 0% to 27%.
   */
  function level(image: Gray, angle: number): Gray {
    const deg = Math.abs(angle) * (180 / Math.PI)
    if (deg < 2 || deg > 40) return image // level enough already; a code on its side is the whole-picture pass's
    const { data, w, h } = image
    const out = new Uint8ClampedArray(w * h)
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const cx = w / 2
    const cy = h / 2
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx
        const dy = y - cy
        const sx = Math.min(w - 1.001, Math.max(0, dx * c - dy * s + cx))
        const sy = Math.min(h - 1.001, Math.max(0, dx * s + dy * c + cy))
        const x0 = Math.floor(sx)
        const y0 = Math.floor(sy)
        const tx = sx - x0
        const ty = sy - y0
        const i = y0 * w + x0
        out[y * w + x] = (data[i]! * (1 - tx) + data[i + 1]! * tx) * (1 - ty) + (data[i + w]! * (1 - tx) + data[i + w + 1]! * tx) * ty
      }
    }
    return { data: out, w, h }
  }

  /** Widens a greyscale picture across the bars only (as grab() does with the canvas): thin bars get more pixels. */
  function widen(image: Gray, factor: number): Gray {
    if (factor <= 1) return image
    const w = Math.round(image.w * factor)
    const out = new Uint8ClampedArray(w * image.h)
    for (let y = 0; y < image.h; y++) {
      for (let x = 0; x < w; x++) {
        const sx = Math.min(image.w - 1, Math.max(0, (x + 0.5) / factor - 0.5))
        const x0 = Math.floor(sx)
        const x1 = Math.min(image.w - 1, x0 + 1)
        const t = sx - x0
        out[y * w + x] = image.data[y * image.w + x0]! * (1 - t) + image.data[y * image.w + x1]! * t
      }
    }
    return { data: out, w, h: image.h }
  }

  /* What the station's autofocus watches (see armAutofocus): how much is in the frame, and since when. */
  const PRESENT = 0.06
  let seen = { strength: 0, at: 0, since: 0 }
  function noteShape(strength: number) {
    const now = Date.now()
    const present = strength >= PRESENT
    seen = { strength, at: now, since: present ? (seen.since || now) : 0 }
  }

  async function beginDecoding(mine: number) {
    let pass = 0

    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: detectorFormats })

      const tick = async () => {
        if (mine !== session || !video.value) return
        try {
          const whole = ++pass % FULL_FRAME_EVERY === 0
          const frame = grab(video.value, whole)
          let found = frame ? await detector.detect(frame) : []
          // Nothing in the plain crop: try it again sharpened (see enhance()), then smoothed harder down the bars, which
          // washes out the fine pattern a camera sees on a phone screen. (This detector turns tilted codes itself.)
          if (frame && !whole && !found[0]?.rawValue) {
            const gray = luminance(frame)
            noteShape(measureShape(gray).strength)
            const asImage = (sharp: Gray) => {
              const rgba = new Uint8ClampedArray(sharp.w * sharp.h * 4)
              for (let i = 0, p = 0; i < sharp.data.length; i++, p += 4) {
                rgba[p] = rgba[p + 1] = rgba[p + 2] = sharp.data[i]!
                rgba[p + 3] = 255
              }
              return new ImageData(rgba, sharp.w, sharp.h)
            }
            found = await detector.detect(asImage(enhance(gray)))
            if (!found[0]?.rawValue) found = await detector.detect(asImage(enhance(gray, 15, 3, 1.5)))
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
      [ZXing.DecodeHintType.POSSIBLE_FORMATS, zxingFormats(ZXing)],
      [ZXing.DecodeHintType.TRY_HARDER, true],
    ]))
    const quick = new ZXing.MultiFormatReader()
    quick.setHints(new Map<any, any>([[ZXing.DecodeHintType.POSSIBLE_FORMATS, zxingFormats(ZXing)]]))

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
      // The frame's crop at the camera's own size: it is levelled first, and only then widened (see level()).
      const frame = grab(video.value, whole, false)
      if (frame) {
        try {
          const image = luminance(frame)
          let text: string | null
          if (whole) text = attempt(quick, image)
          else {
            const shape = measureShape(image)
            noteShape(shape.strength)
            const ready = widen(level(image, shape.angle), Math.max(1, Math.min(2, MAX_CROP_WIDTH / image.w)))
            // Plain, then sharpened, then smoothed harder down the bars (a filmed phone screen's fine pattern). On the
            // bench the last pass took phone-screen reads from 17% to 22%, at most ~50 ms more on a frame nothing reads.
            text = attempt(careful, ready) ?? attempt(careful, enhance(ready)) ?? attempt(careful, enhance(ready, 15, 3, 1.5))
          }
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
    stopFocus()
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
        // A book's barcode is small and a webcam can't focus close, so the book is held back and needs more pixels.
        video: formats === 'isbn'
          ? { facingMode: { ideal: facing.value }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: facing.value }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      const caps = (track?.getCapabilities?.() ?? {}) as any
      torchAvailable.value = !!caps.torch
      // Keep refocusing as the book moves; a fixed focus is the usual reason a close barcode stays a blur.
      if (caps.focusMode?.includes?.('continuous')) {
        try { await track!.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }) } catch { /* optional */ }
      }
      state.value = 'live'
      armAutofocus(track, caps, mine)

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

  return { video, state, facing, torchAvailable, torchOn, focusPhase, start, stop, flip, toggleTorch }
}
