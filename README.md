# Touch Handler

Touch handler is a reusable library to manage touch gestures.

- Dragging
- Long touch
- Two finger dragging
- Two finger zoom/pinch

### Usage

Touch handler produces listeners rather than adding them. A new instance must be defined for different components or tasks.

```js
const touchHandler = new TouchHandler(500, 3);
```

#### Constructor parameters

| Name                   | Description                                          | Default |
| ---------------------- | ---------------------------------------------------- | ------- |
| longTouchDuration (ms) | Time to pass before firing longtouch task            | 500     |
| tolerance (px)         | Touch drag distance to tolerate for long touch tasks | 3       |

Then tasks must be defined.

```js
touchHandler.addGestureListener('drag',
    (touch, lastTouch, evt) => {/* Do things while dragging*/},
    (touch, evt) => {/*Do things when dragging starts*/},
    evt => {/*Do things when dragging ends*/})

touchHandler.addGestureListener('longTouchDrag',
    (touch, lastTouch, evt) => {...},
    null, // Don't want any task when long touch begins
    evt => {...})

// Don't want any task when two finger drag ends
touchHandler.addGestureListener('twoFingerDrag',
    (dragX, dragY, evt) => {...},
    (touch, evt) => {...})

// Don't want any task when two finger zoom begins or ends
touchHandler.addGestureListener('twoFingerZoom',
    (scale, zoomCenter, evt) => {...})
```

For now, task names can only be drag, longTouchDrag, twoFingerDrag or twoFingerZoom. Function parameters can be empty or sent null if a start or end task is not desired. Start and end functions always will have same parameters but firing-functions will differ. Above examples includes all the firing-function parameters. After setting tasks, listeners must be added to desired element or component. Touch handler is React friendly.

```js
element.addEventListener("touchstart", touchHandler.onTouchStart);
element.addEventListener("touchmove", touchHandler.onTouchMove);
element.addEventListener("touchend", touchHandler.onTouchEnd);
```

That's it! All ready to process some touch gestures.

## License

MIT
