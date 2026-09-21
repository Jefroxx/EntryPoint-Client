export type CameraState = 'idle' | 'starting' | 'live' | 'blocked' | 'nocamera' | 'unsupported'

// Browsers with a built-in BarcodeDetector (Chrome, Edge, Chrome on Android) need nothing extra.
// Safari and Firefox don't have one, so this small decoder is loaded on demand, only if it's needed.
const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'
let zxingLoading: Promise<any> | null = null

function loadZxing(): Promise<any> {
  const existing = (window as any).ZXing
  if (existing) return Promise.resolve(existing)

  zxingLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = ZXING_URL
    script.async = true
    script.onload = () => resolve((window as any).ZXing)
    script.onerror = () => {
      zxingLoading = null
      reject(new Error('decoder'))
    }
    document.head.appendChild(script)
  })

  return zxingLoading
}

/**
 * Reads Code 128 barcodes from the webcam or a phone camera. Every read is handed to `onCode`;
 * the same code seen again within a couple of seconds is ignored so one ID is never reported twice.
 * The <video> element is wired up through the returned `video` ref.
 */
export function useCameraScanner(onCode: (code: string) => void) {
  const video = ref<HTMLVideoElement | null>(null)
  const state = ref<CameraState>('idle')
  const facing = ref<'environment' | 'user'>('environment')
  const torchAvailable = ref(false)
  const torchOn = ref(false)

  let stream: MediaStream | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let zxingReader: any = null
  let wakeLock: any = null
  let session = 0 // bumped by stop(), so slow async work from an old session can't act
  let last = { code: '', at: 0 }

  function emit(code: string) {
    const now = Date.now()
    if (code === last.code && now - last.at < 2500) return
    last = { code, at: now }
    onCode(code)
  }

  async function beginDecoding(mine: number) {
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['code_128'] })

      const tick = async () => {
        if (mine !== session || !video.value) return
        try {
          const found = await detector.detect(video.value)
          if (found[0]?.rawValue) emit(found[0].rawValue)
        } catch {
          // The frame isn't ready yet; try again on the next tick.
        }
        timer = setTimeout(tick, 120)
      }

      void tick()
      return
    }

    let ZXing: any
    try {
      ZXing = await loadZxing()
    } catch {
      throw Object.assign(new Error('decoder'), { name: 'DecoderError' })
    }
    if (mine !== session || !video.value || !stream) return

    const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.CODE_128]]])
    zxingReader = new ZXing.BrowserMultiFormatReader(hints, 300)
    void zxingReader.decodeFromStream(stream, video.value, (result: any) => {
      if (result && mine === session) emit(result.getText())
    })
  }

  function release() {
    session++
    clearTimeout(timer)
    try { zxingReader?.reset() } catch { /* already stopped */ }
    zxingReader = null
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
