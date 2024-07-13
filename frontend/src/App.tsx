import { useRef, useState, useEffect } from 'react'
import { getMagnitude, getRandomDots, normalize } from './utils'
import Blob from './components/Blob'
import { BlobData } from './types'

const width = window.innerWidth
const height = window.innerHeight
const initialSizeMainBlob = 50

const App = () => {
  const svg = useRef<SVGSVGElement>(null)
  const [mainBlob, setMainBlob] = useState({
    position: { x: 0, y: 0 },
    r: initialSizeMainBlob,
    id: 0,
    color: "#ffffff"
  })
  const [blobsPositions, setBlobsPositions] = useState(getRandomDots(width, height))

  useEffect(() => {
    const updatePosition = (pt: DOMPoint) => {
      if (svg.current) {
        const screenCTM = svg.current.getScreenCTM()
        if (screenCTM) {
          const loc = pt.matrixTransform(screenCTM.inverse())
          const normalized = normalize(loc.x - width / 2, loc.y - height / 2)
          setMainBlob(prevMainBlob => {
            // Calculate the difference between mouse and blob position
        const dx = loc.x - width / 2 - prevMainBlob.position.x
        const dy = loc.y - height / 2 - prevMainBlob.position.y
        
        // Normalize the difference
        const length = Math.sqrt(dx * dx + dy * dy)
        const normalizedDx = length > 0 ? dx / length : 0
        const normalizedDy = length > 0 ? dy / length : 0
        console.log(normalizedDx)

            return {
              ...prevMainBlob,
              position: {
                x: prevMainBlob.position.x + Math.sign(dx) * normalized.x,
                y: prevMainBlob.position.y + Math.sign(dy) * normalized.y
            }
          }})
        }
      }
    }

    const setPositionUpdater = () => {
      if (svg.current) {
        let point = svg.current.createSVGPoint()
        document.onmousemove = (e) => {
          point.x = e.clientX
          point.y = e.clientY
        }
        document.ontouchmove = (e) => {
          point.x = e.touches[0].clientX
          point.y = e.touches[0].clientY
        }
        const intervalId = setInterval(() => updatePosition(point), 20)
        return () => clearInterval(intervalId)
      }
    }

    setPositionUpdater()
  }, [])

  useEffect(() => {
    blobsPositions.forEach((pos, index) => {
      if (eats(pos)) {
        const newBlobsPositions = blobsPositions.filter((_, i) => i !== index)
        setBlobsPositions(newBlobsPositions)
      }
    })
  }, [mainBlob, blobsPositions])

  const eats = (other: BlobData) => {
    const distance = getMagnitude(mainBlob.position.x - other.position.x, mainBlob.position.y - other.position.y)
    if (distance < mainBlob.r + other.r) {
      setMainBlob(prevMainBlob => ({
        ...prevMainBlob,
        r: getMagnitude(prevMainBlob.r, other.r)
      }))
      return true
    } else {
      return false
    }
  }

  const fullScreen = {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black'
  }

  const transition = {
    transition: "all 0.5s ease-in-out",
    WebkitTransition: "all 0.5s ease-in-out",
    MozTransition: "all 0.5s ease-in-out",
    OTransition: "all 0.5s ease-in-out"
  }

  return (
    <svg style={fullScreen} ref={svg} width={width} height={height}>
      <g style={transition}
        transform={`translate(${width / 2}, ${height / 2}), scale(${initialSizeMainBlob / mainBlob.r})`}>
        <g transform={`translate(${-mainBlob.position.x}, ${-mainBlob.position.y})`}>
          <Blob position={{ x: mainBlob.position.x, y: mainBlob.position.y }} r={mainBlob.r} color={mainBlob.color} />
          {blobsPositions.map(blob => (
            <Blob position={{ x: blob.position.x, y: blob.position.y }} r={blob.r} color={blob.color} key={blob.id} />
          ))}
        </g>
      </g>
    </svg>
  )
}

export default App
