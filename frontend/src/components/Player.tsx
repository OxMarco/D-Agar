import React from 'react'
import { addressToNumber } from '../utils'

const Player = React.memo(({ address, position, r }: { address: string, position: any, r: number }) => {
  const clipId = `clip_${address}`

  return (
    <svg width="100%" height="100%" style={{position: 'absolute', top: 0, left: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>
      <svg x={position.x - r} y={position.y - r} width={r * 2} height={r * 2}>
        <image 
          href={`https://noun.pics/${addressToNumber(address)}.png`} 
          x="0" 
          y="0" 
          width={r * 2} 
          height={r * 2} 
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </svg>
  )
})

export default Player