// Array of SemesterData
export default class WalkData extends Array {
  constructor({ walk, name }) {
    if (walk === undefined) {
      // For Array.prototype.map() to work
      super();
    } else if (typeof walk === 'number') {
      // For Array.prototype.slice() to work
      super(walk);
    } else {
      super(...walk.map(classes => new SemesterData(classes, '')));
      this.name = name;
    }
  }

  toString() {
    return this.map(semData => semData.toString() + ' ').join();
  }

  slice(start, end) {
    let copy = [].slice.call(this, start, end);
    // Shallow copy properties manually
    copy.name = this.name;
    return copy;
  }

  partialDeepCopy(startDepth, sem, idx) {
    let copy = this;
    if (startDepth === 0) {
      copy = copy.slice();
    }
    // Bug: not checking for undefined, 0 is a falsy :(
    if (startDepth <= 1 && sem !== undefined) {
      copy[sem] = copy[sem].slice();
    }
    if (startDepth <= 2 && idx !== undefined) {
      copy[sem][idx] = { ...copy[sem][idx] };
    }
    return copy;
  }

  findContainingSemester(mouseX, mouseY) {
    for (let i = 0; i < this.length; ++i) {
      // Accomodate changing container
      const node = this[i].node;
      const top = node.offsetTop;
      const left = node.offsetLeft;
      const bottom = node.offsetTop + node.offsetHeight;
      const right = node.offsetLeft + node.offsetWidth;
      if (left < mouseX && mouseX < right && top < mouseY && mouseY < bottom) {
        return i;
      }
    }
    return -1;
  }

  insertPlaceholder(sem, idx) {
    this[sem].splice(idx, 0, new ClassData('X'));
  }

  removePlaceholder(blankSem, blankIdx) {
    if (this[blankSem][blankIdx].classNum !== 'X') {
      throw new Error('Not a placeholder!');
    }
    this[blankSem].splice(blankIdx, 1);
  }

  findPlaceholder() {
    for (let i = 0; i < this.length; ++i) {
      const j = this[i].findPlaceholder();
      if (j !== -1) {
        return [i, j];
      }
    }
    return [-1, -1];
  }

  movePlaceholder(blankSem, blankIdx, sem, idx) {
    // Note that we can't remove then insert _new_ placeholder,
    // since it would reset the node reference
    if (this[blankSem][blankIdx].classNum !== 'X') {
      throw new Error('Not a placeholder!');
    }
    const [blankItem] = this[blankSem].splice(blankIdx, 1);
    this[sem].splice(idx, 0, blankItem);
  }

  replacePlaceholder(sem, idx, blankSem, blankIdx) {
    if (this[blankSem][blankIdx].classNum !== 'X') {
      throw new Error('Not a placeholder!');
    }
    [this[sem][idx], this[blankSem][blankIdx]] = [
      this[blankSem][blankIdx],
      this[sem][idx],
    ];
    this[sem].splice(idx, 1);
  }
}

// Array of ClassData
class SemesterData extends Array {
  constructor(classes, name) {
    if (classes === undefined) {
      super();
    } else if (typeof classes === 'number') {
      super(classes);
    } else {
      super(...classes.map(classNum => new ClassData(classNum)));
      this.name = name;
      this.node = null;
    }
  }

  toString() {
    // Need to incorporate isDragged to handle stopDragClass properly
    return this.map(({ classNum, isDragged }) => +isDragged + classNum).join();
  }

  slice(start, end) {
    let copy = [].slice.call(this, start, end);
    copy.name = this.name;
    copy.node = this.node;
    return copy;
  }

  findPlaceholder() {
    for (let j = 0; j < this.length; ++j) {
      if (this[j].classNum === 'X') {
        return j;
      }
    }
    return -1;
  }

  findClosest(originX, originY, excludeIdx) {
    let minDistanceSq = Infinity;
    let closestIdx;
    for (let i = 0; i < this.length; ++i) {
      // Skip the taken-out aka dragged element
      if (i === excludeIdx) {
        continue;
      }
      const node = this[i].node;

      // Calculate center coord
      const targetX = node.offsetLeft + node.offsetWidth / 2;
      const targetY = node.offsetTop + node.offsetHeight / 2;

      const distanceSq = (targetX - originX) ** 2 + (targetY - originY) ** 2;
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestIdx = i;
      }
    }
    return closestIdx;
  }
}

class ClassData {
  constructor(number) {
    this.classNum = number;
    this.isDragged = false;
    this.dragX = 0;
    this.dragY = 0;
    this.node = null;
  }
}
