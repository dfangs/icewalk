import React from 'react';
import { Flipper } from 'react-flip-toolkit';
// import { cloneDeep } from 'lodash';

import Semester from './Semester';

export default function RoadGrid({ walk, ...props }) {
  return (
    <Flipper flipKey={walk.toString()} className="course-grid">
      {walk.map((classes, i) => (
        <Semester key={i} sem={i} classes={classes} {...props} />
      ))}
    </Flipper>
  );
}
