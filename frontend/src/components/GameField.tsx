import React, { useState, useRef, useCallback, useEffect } from 'react';
import Blob from './Blob';
import { getRandomDots, normalize, eats } from '../utils/blobUtils';
import useAnimationFrame from '../hooks/useAnimationFrame';
import { BlobData, Position } from '../types';

const INITIAL_SIZE_MAIN_BLOB = 50;
const GROWTH_RATE = 0.1;
const MOVEMENT_SPEED = 0.1;

const GameField: React.FC = () => {
  const svg = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [mainBlob, setMainBlob] = useState<BlobData>({
    position: { x: 0, y: 0 },
    r: INITIAL_SIZE_MAIN_BLOB,
    id: 0,
    color: "#ffffff"
  });
  const [blobsPositions, setBlobsPositions] = useState(() =>
    getRandomDots(dimensions.width, dimensions.height)
  );
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    if (svg.current) {
      const svgRect = svg.current.getBoundingClientRect();
      const targetX = mousePosition.x - svgRect.left - dimensions.width / 2;
      const targetY = mousePosition.y - svgRect.top - dimensions.height / 2;
      
      setMainBlob(prev => {
        const dx = targetX - prev.position.x;
        const dy = targetY - prev.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const movement = Math.min(distance, MOVEMENT_SPEED * prev.r);
        
        if (distance > 0) {
          return {
            ...prev,
            position: {
              x: prev.position.x + (dx / distance) * movement,
              y: prev.position.y + (dy / distance) * movement
            }
          };
        }
        return prev;
      });
    }
  }, [dimensions, mousePosition]);

  const updateBlobs = useCallback(() => {
    setBlobsPositions(prev => prev.filter(blob => !eats(mainBlob, blob)));
    setMainBlob(prev => ({
      ...prev,
      r: prev.r + GROWTH_RATE
    }));
  }, [mainBlob]);

  useAnimationFrame((deltaTime) => {
    updatePosition();
    updateBlobs();
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const scale = INITIAL_SIZE_MAIN_BLOB / mainBlob.r;

  return (
    <svg ref={svg} width={dimensions.width} height={dimensions.height} style={{ background: 'black' }}>
      <g transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2}) scale(${scale})`}>
        <g transform={`translate(${-mainBlob.position.x}, ${-mainBlob.position.y})`}>
          <Blob {...mainBlob} />
          {blobsPositions.map(blob => (
            <Blob key={blob.id} {...blob} />
          ))}
        </g>
      </g>
    </svg>
  );
};

export default GameField;
