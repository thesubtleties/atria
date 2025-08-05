import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './NetworkGraph.module.css'

gsap.registerPlugin(ScrollTrigger)

const defaultNodes = [
  { cx: 200, cy: 200, r: 40, fill: 'var(--color-primary)', icon: '👤' },
  { cx: 400, cy: 100, r: 35, fill: 'var(--color-accent-yellow)', icon: '👥', textFill: 'black' },
  { cx: 600, cy: 150, r: 30, fill: 'var(--color-primary)', icon: '👤' },
  { cx: 300, cy: 300, r: 35, fill: 'var(--color-accent-yellow)', icon: '👥', textFill: 'black' },
  { cx: 500, cy: 280, r: 45, fill: 'var(--color-primary)', icon: '🌟', fontSize: 25 }
]

const defaultConnections = [
  { x1: 200, y1: 200, x2: 400, y2: 100 },
  { x1: 400, y1: 100, x2: 600, y2: 150 },
  { x1: 200, y1: 200, x2: 300, y2: 300 },
  { x1: 300, y1: 300, x2: 500, y2: 280 },
  { x1: 400, y1: 100, x2: 500, y2: 280 },
  { x1: 600, y1: 150, x2: 500, y2: 280 }
]

const NetworkGraph = ({
  nodes = defaultNodes,
  connections = defaultConnections,
  viewBox = "0 0 800 400",
  animationDelay = 0.1,
  connectionColor = 'var(--color-primary)',
  className = ''
}) => {
  const svgRef = useRef(null)

  useGSAP(() => {
    const nodeElements = gsap.utils.toArray('.network-node')
    const connectionElements = gsap.utils.toArray('.network-connection')

    if (nodeElements.length && connectionElements.length) {
      gsap.set(connectionElements, { opacity: 0, scale: 0 })
      gsap.set(nodeElements, { opacity: 0, scale: 0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: svgRef.current,
          start: 'top 80%',
          once: true
        }
      })

      tl.to(nodeElements, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: animationDelay,
        ease: 'back.out(1.7)'
      })
      .to(connectionElements, {
        opacity: 0.3,
        scale: 1,
        duration: 0.8,
        stagger: animationDelay / 2,
        ease: 'power2.out'
      }, '-=0.4')
    }
  }, { scope: svgRef })

  return (
    <svg 
      ref={svgRef}
      viewBox={viewBox} 
      className={`${styles.networkSvg} ${className}`}
    >
      {/* Connections */}
      {connections.map((conn, index) => (
        <line 
          key={`conn-${index}`}
          className="network-connection" 
          x1={conn.x1} 
          y1={conn.y1} 
          x2={conn.x2} 
          y2={conn.y2} 
          stroke={connectionColor} 
          strokeWidth="2" 
        />
      ))}
      
      {/* Nodes */}
      {nodes.map((node, index) => (
        <g key={`node-${index}`} className="network-node">
          <circle 
            cx={node.cx} 
            cy={node.cy} 
            r={node.r} 
            fill={node.fill} 
          />
          <text 
            x={node.cx} 
            y={node.cy + 10} 
            textAnchor="middle" 
            fill={node.textFill || 'white'} 
            fontSize={node.fontSize || 20}
          >
            {node.icon}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default NetworkGraph