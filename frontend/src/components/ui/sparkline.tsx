import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  height?: number
  width?: number
  color?: string
  fill?: boolean
  className?: string
}

function Sparkline({
  data,
  height = 24,
  width = 80,
  color = 'currentColor',
  fill = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padding = 1

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return { x, y }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const last = points[points.length - 1]
  const first = points[0]

  const fillPath = fill && last && first
    ? `${linePath} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`
    : ''

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      preserveAspectRatio="none"
    >
      {fill && (
        <path
          d={fillPath}
          fill={color}
          opacity={0.1}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export { Sparkline }
export type { SparklineProps }
