/**
 * Fix overly aggressive zoom in Ant Design's image preview.
 *
 * 1) Interval filter: only allow one wheel event per interval to reduce zoom frequency.
 * 2) Counter-scale: read wrapper scale from Ant Design, apply inverse scale to the inner
 *    image element so the effective zoom is gentler. Ant Design doesn't touch the inner
 *    image's transform so our scale persists.
 */

const WHEEL_INTERVAL_MS = 120   // Minimum ms between zoom steps
const EFFECTIVE_ZOOM = 0.4      // Effective zoom power (1.0 = no change, 0.4 = much gentler)

let lastAllowedTime = 0
let wheelHandlerBound = false
let rafBound = false

export function setupPreviewWheelNormalization() {
  if (wheelHandlerBound) return
  wheelHandlerBound = true

  window.addEventListener('wheel', (e) => {
    const target = e.target as HTMLElement
    const previewRoot = target?.closest?.('.ant-image-preview-root')
    if (!previewRoot) return

    const now = Date.now()
    if (now - lastAllowedTime < WHEEL_INTERVAL_MS) {
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    }
    lastAllowedTime = now
  }, { capture: true, passive: false })

  if (!rafBound) {
    rafBound = true
    requestAnimationFrame(temperLoop)
  }
}

function parseScale(transform: string): number {
  const m = transform.match(/scale\(([^)]+)\)/)
  if (m) return parseFloat(m[1])
  const m2 = transform.match(/matrix\(([^)]+)\)/)
  if (m2) return parseFloat(m2[1].split(',')[0].trim())
  return 1
}

function temperLoop() {
  const wrapper = document.querySelector('.ant-image-preview-wrap') as HTMLElement | null
  const root = document.querySelector('.ant-image-preview-root')

  if (wrapper && root) {
    const transform = wrapper.style.transform
    if (transform) {
      const adScale = parseScale(transform)
      // Counter-scale: if Ant Design zoomed to 2x, we scale image down
      // so effective zoom = adScale ^ EFFECTIVE_ZOOM
      const effectiveScale = Math.pow(adScale, EFFECTIVE_ZOOM)
      const counterScale = effectiveScale / adScale  // What we need to multiply by

      const img = wrapper.querySelector('img') as HTMLElement | null
      if (img) {
        img.style.transform = `scale(${counterScale})`
        img.style.transformOrigin = 'center center'
      }
    }
  }

  requestAnimationFrame(temperLoop)
}

export const closeImageFullscreenPreview = () => {
  const ele = Array.from(document.querySelectorAll('.ant-image-preview-wrap') as unknown as HTMLDivElement[])
    .find(e => e.style.display !== 'none');
  if (ele) {
    console.log('closeImageFullscreenPreview success');
    simulateClick(ele);
  } else {
    console.log('closeImageFullscreenPreview not found');
  }
};

function simulateClick(element: HTMLElement) {
  if (!(element instanceof HTMLElement)) {
    throw Error('The provided value is not an HTMLElement.');
  }

  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    target: element as any,
  } as any);

  element.dispatchEvent(event);
}


export const openImageFullscreenPreview = (idx: number, root: HTMLElement) => {
  const el = root.querySelector(`.idx-${idx} .ant-image-img`) as HTMLImageElement | null
  if (el) {
    el.click()
  } else {
    console.log('openImageFullscreenPreview error: not found', idx, root);
  }
}
