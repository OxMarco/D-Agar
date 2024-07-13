import React from 'react';
import { BlobData } from '../types';

const Blob: React.FC<BlobData> = React.memo(({ position, r, color }) => {
  return (
    <circle
      cx={position.x}
      cy={position.y}
      r={r}
      fill={color}
      style={{
        transition: 'r 0.2s ease-in-out',
      }}
    />
  );
});

export default Blob;
