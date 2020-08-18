import React, { useReducer } from 'react';

import data from '../data';
import WalkData from '../dataModel';

import RoadGrid from './RoadGrid';
import CourseFinder from './CourseFinder';

export default function MainInterface() {
  const [walk, updateWalk] = useReducer(walkReducer, initialWalk);

  return (
    <WalkDispatch.Provider value={updateWalk}>
      <div className="main-content">
        <RoadGrid walk={walk} />
        <CourseFinder />
      </div>
    </WalkDispatch.Provider>
  );
}

export var WalkDispatch = React.createContext(null);

function walkReducer(prevWalk, action) {
  // Strategy: Shallow copy, but partially deep copy as needed
  // Note that most cases it's safe to deep copy only till the second array
  let nextWalk = prevWalk;

  switch (action.type) {
    case 'registerSemesterNode': {
      const { sem, node } = action;
      nextWalk = nextWalk.partialDeepCopy(0, sem);
      nextWalk[sem].node = node;
      return nextWalk;
    }

    case 'registerClassNode': {
      const { sem, idx, node } = action;
      nextWalk = nextWalk.partialDeepCopy(0, sem, idx);
      nextWalk[sem][idx].node = node;
      return nextWalk;
    }

    case 'startDragClass': {
      const { sem, idx } = action;
      nextWalk = nextWalk.partialDeepCopy(0, sem, idx);

      // Anchor to containing Semester's top left
      const draggedNode = nextWalk[sem][idx].node;
      nextWalk[sem][idx].isDragged = true;
      nextWalk[sem][idx].dragX = draggedNode.offsetLeft;
      nextWalk[sem][idx].dragY = draggedNode.offsetTop;

      // Insert dummy item
      nextWalk.insertPlaceholder(sem, idx + 1);

      return nextWalk;
    }

    case 'onDragClass': {
      const { sem, idx, dragData, mouseData } = action;
      nextWalk = nextWalk.partialDeepCopy(0, sem, idx);

      // Update controlled component
      nextWalk[sem][idx].dragX = dragData.x;
      nextWalk[sem][idx].dragY = dragData.y;

      // Calculate mouse position relative to CourseGrid
      const absoluteX =
        nextWalk[sem].node.offsetLeft + dragData.x + mouseData.x;
      const absoluteY = nextWalk[sem].node.offsetTop + dragData.y + mouseData.y;

      // Determine which Semester it belongs to
      const nextSem = nextWalk.findContainingSemester(absoluteX, absoluteY);

      // Find placeholder
      const [blankSem, blankIdx] = nextWalk.findPlaceholder();

      // Within bound
      if (nextSem !== -1) {
        // Calculate *center* position relative to target Semester
        const itemWidth = nextWalk[sem][idx].node.offsetWidth;
        const itemHeight = nextWalk[sem][idx].node.offsetHeight;
        const originX =
          absoluteX -
          mouseData.x +
          itemWidth / 2 -
          nextWalk[nextSem].node.offsetLeft;
        const originY =
          absoluteY -
          mouseData.y +
          itemHeight / 2 -
          nextWalk[nextSem].node.offsetTop;

        const nextIdx = nextWalk[nextSem].findClosest(
          originX,
          originY,
          nextSem == sem ? idx : -1
        );

        // Move if it exists, else insert new placeholder
        nextWalk = nextWalk.partialDeepCopy(1, nextSem);
        if (blankSem !== -1) {
          // Two cases: not shifted & shifted (by prev removal), both lead to same idx
          nextWalk = nextWalk.partialDeepCopy(1, blankSem);
          nextWalk.movePlaceholder(blankSem, blankIdx, nextSem, nextIdx);
        } else {
          nextWalk.insertPlaceholder(nextSem, nextIdx);
        }
      } else if (blankSem !== -1) {
        // Simply remove if out of bound but placeholder exists
        nextWalk = nextWalk.partialDeepCopy(1, blankSem);
        nextWalk.removePlaceholder(blankSem, blankIdx);
      }

      // Else, do nothing
      return nextWalk;
    }

    case 'stopDragClass': {
      const { sem, idx } = action;
      nextWalk = nextWalk.partialDeepCopy(0, sem, idx);

      // Reset position to normal flow
      nextWalk[sem][idx].isDragged = false;
      nextWalk[sem][idx].dragX = 0;
      nextWalk[sem][idx].dragY = 0;

      // Swap with placeholder then remove it, if it exists
      // Otherwise simply reset to original
      const [blankSem, blankIdx] = nextWalk.findPlaceholder();
      if (blankSem !== -1) {
        nextWalk = nextWalk.partialDeepCopy(1, blankSem);
        nextWalk.replacePlaceholder(sem, idx, blankSem, blankIdx);
      }

      return nextWalk;
    }
  }
}

var initialWalk = new WalkData(data);
