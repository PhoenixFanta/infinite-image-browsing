
/**
 * Fix overly aggressive zoom on macOS trackpads in Ant Design's image preview.
 *
 * Ant Design Vue's Preview fires one zoom step per wheel event.
 * macOS trackpads fire a burst of events (5-35ms apart) on a single scroll/pinch gesture,
 * causing excessive zoom (one gesture = 3-5 zoom steps instead of 1).
 *
 * Fix: Listen on window in capture phase (fires before Ant Design's bubble-phase handler).
 * Block events that arrive within 50ms of the last allowed one — these are part of
 * the same scroll gesture. Events 50ms+ apart pass through normally.
 */

const BURST_THRESHOLD_MS = 50  // Events within 50ms of last zoom are the same gesture

let lastAllowedTime = 0
let wheelHandlerBound = false

export function setupPreviewWheelNormalization() {
  if (wheelHandlerBound) return
  wheelHandlerBound = true

  // window capture fires before any bubble listeners
  // Ant Design adds its wheel listener on window in bubble phase
  window.addEventListener('wheel', (e) => {
    const target = e.target as HTMLElement
    const previewRoot = target?.closest?.('.ant-image-preview-root')

    if (!previewRoot) return

    const now = Date.now()
    const gap = now - lastAllowedTime

    if (gap < BURST_THRESHOLD_MS) {
      // Part of the same gesture — block from reaching Ant Design's handler
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    }

    lastAllowedTime = now
    // Event passes through to Ant Design's normal handler
  }, { capture: true, passive: false })
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
    throw new Error('The provided value is not an HTMLElement.');
  }

  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    target: element, // Although setting target here has no effect as it's a read-only property
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
