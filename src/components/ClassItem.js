import React, { useState, useCallback, useContext } from 'react';
import Draggable from 'react-draggable';
import { Flipped } from 'react-flip-toolkit';

import { WalkDispatch } from './MainInterface';

export default function ClassItem({ classNum, sem, idx, dragPos, isDragged }) {
  const walkDispatch = useContext(WalkDispatch);

  // Although refCallback is only called when mounting & unmounting,
  // ref will trigger re-render if not memoized (props change)
  const refCallback = useCallback(
    node => {
      if (node !== null) {
        walkDispatch({ type: 'registerClassNode', sem, idx, node });
      }
    },
    [sem, idx, walkDispatch]
  );

  const [mouseData, setMouseData] = useState({});

  const dragHandlers = {
    onStart: e => {
      const nodeRect = e.target.getBoundingClientRect();
      setMouseData({
        x: Math.round(e.clientX) - nodeRect.left,
        y: Math.round(e.clientY) - nodeRect.top,
      });
      walkDispatch({ type: 'startDragClass', sem, idx });
    },
    onDrag: (e, dragData) => {
      walkDispatch({ type: 'onDragClass', sem, idx, dragData, mouseData });
    },
    onStop: () => {
      walkDispatch({ type: 'stopDragClass', sem, idx });
    },
  };

  let wrapperClassName = '';
  if (isDragged) {
    wrapperClassName = 'dragged';
  } else if (classNum === 'X') {
    wrapperClassName = 'placeholder';
  }

  return (
    <Draggable {...dragHandlers} position={dragPos}>
      <div ref={refCallback} className={wrapperClassName}>
        <Flipped flipId={classNum}>
          <div className="class-item">
            <span>{classNum}</span>
          </div>
        </Flipped>
      </div>
    </Draggable>
  );
}
