export class TouchHandler {
  constructor (longTouchDuration = 500, tolerance = 3) {
    this.touchDuration = longTouchDuration
    this.tolerance = tolerance
    this.touchCache = []
    this.dragStart = this.dragging = false
    this.functions = {
      longTouchDrag: [],
      drag: [],
      twoFingerZoom: [],
      twoFingerDrag: []
    }
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
  }

  addGestureListener (name, func, startFunc, endFunc) {
    if (!this.functions[name]) {
      console.error(`No gesture named ${name}`)
      return
    }
    if (startFunc) func.start = startFunc
    if (endFunc) func.end = endFunc
    this.functions[name].push(func)
  }

  handleTwoFinger (evt) {
    const { touchCache } = this
    if (evt.targetTouches.length !== 2 || evt.changedTouches.length <= 0) return
    const touch1 = evt.targetTouches[0]
    const touch2 = evt.targetTouches[1]
    let index1 = -1
    let index2 = -1
    touchCache.forEach((touch, i) => {
      if (touch.identifier === touch1.identifier) index1 = i
      else if (touch.identifier === touch2.identifier) index2 = i
    })
    if (index1 < 0 || index2 < 0) {
      this.touchCache = []
      return
    }
    this.twoFingerDragging = true
    const diffX1 = touch1.clientX - touchCache[index1].clientX
    const diffX2 = touch2.clientX - touchCache[index2].clientX
    const diffY1 = touch1.clientY - touchCache[index1].clientY
    const diffY2 = touch2.clientY - touchCache[index2].clientY
    let panX = 0
    let panY = 0

    if (diffX1 > 0 && diffX2 > 0) panX = -Math.min(diffX1, diffX2)
    else if (diffX1 < 0 && diffX2 < 0) panX = -Math.max(diffX1, diffX2)

    if (diffY1 > 0 && diffY2 > 0) panY = -Math.min(diffY1, diffY2)
    else if (diffY1 < 0 && diffY2 < 0) panY = -Math.max(diffY1, diffY2)

    const zoom = (touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2 >
    (touchCache[index1].clientX - touchCache[index2].clientX) ** 2 +
    (touchCache[index1].clientY - touchCache[index2].clientY) ** 2
    const scale = Math.hypot(diffX1 - diffX2, diffY1 - diffY2) * (zoom ? 1 : -1)
    this.zoomCenter = {
      x: (touchCache[index1].clientX + touchCache[index2].clientX) / 2,
      y: (touchCache[index1].clientY + touchCache[index2].clientY) / 2
    }
    this.functions.twoFingerZoom.forEach(func => func(scale, this.zoomCenter, evt))
    this.functions.twoFingerDrag.forEach(func => func(panX, panY, evt))

    this.touchCache = [touch1, touch2]
  }

  onTouchStart (evt) {
    if (!evt.persist) evt.preventDefault() // If not React
    if (evt.targetTouches.length > 2) return
    const { touchCache } = this
    if (evt.targetTouches.length === 2 && (this.functions.twoFingerDrag || this.functions.twoFingerZoom)) {
      touchCache.push(...evt.targetTouches)
      clearTimeout(this.touchTimer)
      this.touchTimer = null
      this.functions.twoFingerDrag.forEach(({ start }) => start && start(evt.touches[0], evt))
      this.functions.twoFingerZoom.forEach(({ start }) => start && start(evt.touches[0], evt))
      return
    }
    if (this.functions.longTouchDrag) {
      evt.persist?.() // For React event to persist async
      this.touchTimer = setTimeout(() => {
        this.longtouched = true
        this.touchTimer = null
        this.functions.longTouchDrag.forEach(({ start }) => start && start(evt.touches[0], evt))
      }, this.touchDuration)
    }
    this.lastTouch = evt.touches[0]
    if (evt.touches.length === 1) {
      this.dragStart = true
      this.dragging = false
      this.functions.drag.forEach(({ start }) => start && start(evt.touches[0], evt))
    }
  }

  onTouchMove (evt) {
    const { lastTouch } = this
    if (evt.targetTouches.length === 2 && (this.functions.twoFingerDrag || this.functions.twoFingerZoom)) {
      this.handleTwoFinger(evt)
      return
    }
    const touch = evt.touches[0]
    if (this.longtouched) {
      this.functions.longTouchDrag.forEach(func => func(touch, lastTouch, evt))
      return
    }
    if (this.touchTimer) {
      if ((lastTouch.clientX - touch.clientX) ** 2 + (lastTouch.clientY - touch.clientY) ** 2 > this.tolerance ** 2) {
        clearTimeout(this.touchTimer)
        this.touchTimer = null
      } else return
    }

    if (!this.dragStart) return
    this.dragging = true
    this.functions.drag.forEach(func => func(touch, lastTouch, evt))
    this.lastTouch = touch
  }

  onTouchEnd (evt) {
    if (this.longtouched) {
      this.longtouched = false
      this.functions.longTouchDrag.forEach(({ end }) => end && end(evt))
      return
    }
    if (this.touchTimer) {
      clearTimeout(this.touchTimer)
      this.touchTimer = null
    }

    if (this.twoFingerDragging) {
      const stillDragging = this.touchCache.every(touch => {
        for (const t of evt.touches) if (t.identifier === touch.identifier) return true
        return false
      })
      if (!stillDragging) {
        this.functions.twoFingerDrag.forEach(({ end }) => end && end(evt))
        this.functions.twoFingerZoom.forEach(({ end }) => end && end(evt))
        this.lastTouch = evt.touches[0]
        this.twoFingerDragging = false
        this.touchCache = []
        return
      }
    }
    if (!this.dragStart) return
    this.dragStart = false
    this.functions.drag.forEach(({ end }) => end && end(evt))
    this.dragging = false
  }
}
