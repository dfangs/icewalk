import React, { useCallback, useContext } from 'react';
import { Flipped } from 'react-flip-toolkit';

import { WalkDispatch } from './MainInterface';
import ClassItem from './ClassItem';

export default function Semester({ sem, classes, ...props }) {
  const walkDispatch = useContext(WalkDispatch);

  const refCallback = useCallback(
    node => {
      if (node !== null) {
        walkDispatch({ type: 'registerSemesterNode', sem, node });
      }
    },
    [sem, walkDispatch]
  );

  return (
    <Flipped flipId={sem + classes.toString()}>
      <ul className="semester-list" ref={refCallback}>
        {classes.map(({ classNum, dragX, dragY, isDragged }, idx) => (
          <ClassItem
            key={classNum}
            classNum={classNum}
            sem={sem}
            idx={idx}
            dragPos={{ x: dragX, y: dragY }}
            isDragged={isDragged}
            {...props}
          />
        ))}
      </ul>
    </Flipped>
  );
}
