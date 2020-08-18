import React, { useCallback, useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import Draggable from 'react-draggable';
import cloneDeep from 'lodash/cloneDeep';
import shuffle from 'lodash/shuffle';
import './styles.css';

const roads = {
  name: 'First Road',
  road: [
    ['6.008', '6.009', '8.022', '21W.035'],
    ['6.006', '6.03', '6.036', '6.S077', '21G.502'],
    ['6.003', '6.004', '6.031', '6.046', '21G.503', '7.012'],
    ['6.033', '6.823', '6.141', '21M.051', '21G.504'],
    ['6.172', '6.818', '6.S081', '6.UAT', '21G.505'],
    ['6.824', '6.830', '17.53', '21G.506'],
    ['6.837', '6.836', '6.175'],
    ['6.825'],
  ],
};

function findPlaceholder(road) {
  for (let i = 0; i < road.length; ++i) {
    const j = road[i].findIndex(obj => obj.classNum === 'X');
    if (j !== -1) {
      return [i, j];
    }
  }
  return [-1, -1];
}

export default function App() {
  return (
    <div className="App">
      <RoadGrid road={roads.road} />
    </div>
  );
}

function RoadGrid(props) {
  // Array of array of {classNum, node, etc.}
  const [road, setRoad] = useState(
    props.road.map(row =>
      row.map(cell => ({
        classNum: cell,
        dragX: 0,
        dragY: 0,
        isDragged: false,
        node: null,
      }))
    )
  );
  const [semesterNodes, setSemesterNodes] = useState(
    props.road.map(() => null)
  );

  const registerClassNode = useCallback(
    (sem, idx, node) =>
      // Use callback version of setState to avoid dependencies
      setRoad(prevRoad => {
        let nextRoad = cloneDeep(prevRoad);
        nextRoad[sem][idx].node = node;
        return nextRoad;
      }),
    []
  );

  const registerSemesterNode = useCallback(
    (sem, node) =>
      setSemesterNodes(prevNodes => {
        let nextNodes = prevNodes.slice();
        nextNodes[sem] = node;
        return nextNodes;
      }),
    []
  );

  const whileDragging = useCallback(
    (sem, idx, dragData, mouseData) =>
      setRoad(prevRoad => {
        let nextRoad = cloneDeep(prevRoad);

        // Update controlled component
        nextRoad[sem][idx].dragX = dragData.x;
        nextRoad[sem][idx].dragY = dragData.y;

        // Save dimensions
        const itemWidth = nextRoad[sem][idx].node.offsetWidth;
        const itemHeight = nextRoad[sem][idx].node.offsetHeight;
        const semesterWidth = semesterNodes[sem].offsetWidth; // Be careful with changing container
        const semesterHeight = semesterNodes[sem].offsetHeight;

        // Calculate mouse position relative to CourseGrid
        const absoluteX =
          semesterNodes[sem].offsetLeft + dragData.x + mouseData.x;
        const absoluteY =
          semesterNodes[sem].offsetTop + dragData.y + mouseData.y;

        // Determine which Semester it belongs to
        let nextSem = semesterNodes.findIndex(node => {
          const [top, left] = [node.offsetTop, node.offsetLeft];
          return (
            left < absoluteX &&
            absoluteX < left + semesterWidth &&
            top < absoluteY &&
            absoluteY < top + semesterHeight
          );
        });

        // Find placeholder
        const [blankSem, blankIdx] = findPlaceholder(nextRoad);

        // Within bound
        if (nextSem !== -1) {
          // Calculate *center* position relative to target Semester
          const originX =
            absoluteX -
            mouseData.x +
            itemWidth / 2 -
            semesterNodes[nextSem].offsetLeft;
          const originY =
            absoluteY -
            mouseData.y +
            itemHeight / 2 -
            semesterNodes[nextSem].offsetTop;

          // Gather center coords of target Semester
          const centerCoords = nextRoad[nextSem].map(obj => {
            return {
              targetX: obj.node.offsetLeft + itemWidth / 2,
              targetY: obj.node.offsetTop + itemHeight / 2,
            };
          });

          // Find closest node
          let minDistanceSq = Infinity;
          let nextIdx;
          for (let i = 0; i < centerCoords.length; ++i) {
            // Skip the taken-out aka dragged element
            if (nextSem === sem && i === idx) {
              continue;
            }
            const { targetX, targetY } = centerCoords[i];
            const distanceSq =
              (targetX - originX) ** 2 + (targetY - originY) ** 2;
            if (distanceSq < minDistanceSq) {
              minDistanceSq = distanceSq;
              nextIdx = i;
            }
          }

          // Move placeholder to target position
          // Two cases: insert normal (shift elements right), or
          // if (nextSem === sem && nextIdx > idx), which shifts elements left
          // but 1 - 1 = 0 so it turns out the same.
          if (blankSem !== -1) {
            const [blankItem] = nextRoad[blankSem].splice(blankIdx, 1);
            nextRoad[nextSem].splice(nextIdx, 0, blankItem);
          } else {
            nextRoad[nextSem].splice(nextIdx, 0, {
              classNum: 'X',
              dragX: 0,
              dragY: 0,
              isDragged: false,
              node: null,
            });
          }
        } else if (blankSem !== -1) {
          // Simply remove if out of bound but placeholder exists
          nextRoad[blankSem].splice(blankIdx, 1);
        }

        // Else, do nothing
        return nextRoad;
      }),
    [semesterNodes]
  );

  const itemCallbacks = {
    startDragging: (sem, idx) => {
      let nextRoad = cloneDeep(road);

      // Anchor to containing Semester's top left
      const draggedNode = nextRoad[sem][idx].node;
      nextRoad[sem][idx].isDragged = true;
      nextRoad[sem][idx].dragX = draggedNode.offsetLeft;
      nextRoad[sem][idx].dragY = draggedNode.offsetTop;

      // Insert dummy item
      nextRoad[sem].splice(idx + 1, 0, {
        classNum: 'X',
        dragX: 0,
        dragY: 0,
        isDragged: false,
        node: null,
      });
      setRoad(nextRoad);
    },
    whileDragging: whileDragging,
    stopDragging: (sem, idx) => {
      let nextRoad = cloneDeep(road);

      // Reset position to normal flow
      nextRoad[sem][idx].isDragged = false;
      nextRoad[sem][idx].dragX = 0;
      nextRoad[sem][idx].dragY = 0;

      // Swap with placeholder then remove it, if it exists
      // Otherwise simply reset to original
      const [blankSem, blankIdx] = findPlaceholder(nextRoad);
      if (blankSem !== -1) {
        [nextRoad[sem][idx], nextRoad[blankSem][blankIdx]] = [
          nextRoad[blankSem][blankIdx],
          nextRoad[sem][idx],
        ];
        nextRoad[sem].splice(idx, 1);
      }

      setRoad(nextRoad);
    },
    registerClassNode: registerClassNode,
  };

  const semesterCallbacks = {
    registerSemesterNode: registerSemesterNode,
  };

  const handleShift = () => {
    let shifted = cloneDeep(road);
    shifted = shuffle(shifted);
    setRoad(shifted);
  };

  return (
    <Flipper
      flipKey={road
        .map(data => data.map(o => o.classNum + o.isDragged))
        .join(',')}
    >
      <button onClick={handleShift}>Shuffle!</button>
      <div className="course-grid">
        {road.map((data, i) => (
          <Semester
            key={i}
            sem={i}
            data={data}
            itemCallbacks={itemCallbacks}
            semesterCallbacks={semesterCallbacks}
          />
        ))}
      </div>
    </Flipper>
  );
}

function Semester({ sem, data, semesterCallbacks, ...props }) {
  const { registerSemesterNode, ...dragCallbacks } = semesterCallbacks;

  const refCallback = useCallback(
    node => {
      if (node !== null) {
        registerSemesterNode(sem, node);
      }
    },
    [sem, registerSemesterNode]
  );

  const dragHandlers = {
    onStart: () => {},
    onDrag: (e, dragData) => {},
    onStop: () => {},
  };

  return (
    <Draggable handle=".semester-handle" {...dragHandlers}>
      <div ref={refCallback}>
        <ul className="semester-list">
          {data.map(({ classNum, dragX, dragY, isDragged }, idx) => (
            <ClassItem
              key={classNum}
              classNum={classNum}
              classIdx={[sem, idx]}
              dragPos={{ x: dragX, y: dragY }}
              isDragged={isDragged}
              {...props}
            />
          ))}
        </ul>
        <span className="semester-handle"></span>
      </div>
    </Draggable>
  );
}

function ClassItem({ classNum, dragPos, isDragged, ...props }) {
  const [sem, idx] = props.classIdx; // Unpack to primitives
  const { registerClassNode, ...dragCallbacks } = props.itemCallbacks;

  // Although refCallback is only called when mounting & unmounting,
  // ref will trigger re-render if not memoized (props change)
  const refCallback = useCallback(
    node => {
      if (node !== null) {
        registerClassNode(sem, idx, node);
      }
    },
    [sem, idx, registerClassNode] // Use primitives or memoized callback
  );

  const [mouseData, setMouseData] = useState({});

  const dragHandlers = {
    onStart: e => {
      const nodeRect = e.target.getBoundingClientRect();
      setMouseData({
        x: Math.round(e.clientX) - nodeRect.left,
        y: Math.round(e.clientY) - nodeRect.top,
      });
      dragCallbacks.startDragging(sem, idx);
    },
    onDrag: (e, dragData) => {
      dragCallbacks.whileDragging(sem, idx, dragData, mouseData);
    },
    onStop: () => {
      dragCallbacks.stopDragging(sem, idx);
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
