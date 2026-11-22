import type React from "react"

interface ScoreRingProps {
  score: number | null
  size?: number
  strokeWidth?: number
  sectorAverage?: number | null
  showLabel?: boolean
  className?: string
}

export function ScoreRing({
  score,
  size = 64,
  strokeWidth = 2,
  sectorAverage,
  showLabel = true,
  className = "",
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const hasScore = score != null

  // Sector average tick position
  const avgAngle = sectorAverage != null ? (sectorAverage / 100) * 360 - 90 : 0
  const avgRad = (avgAngle * Math.PI) / 180
  const tickInner = radius - 5
  const tickOuter = radius + 5

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(0.25 0 0)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(0.7 0.2 45)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - ((hasScore ? score : 0) / 100) * circumference}
          className="ring-draw"
          style={{ "--circumference": circumference } as React.CSSProperties}
        />
      </svg>
      {sectorAverage != null && (
        <svg width={size} height={size} className="absolute inset-0" aria-hidden="true">
          <line
            x1={center + tickInner * Math.cos(avgRad)}
            y1={center + tickInner * Math.sin(avgRad)}
            x2={center + tickOuter * Math.cos(avgRad)}
            y2={center + tickOuter * Math.sin(avgRad)}
            stroke="oklch(0.55 0 0)"
            strokeWidth={1.5}
          />
        </svg>
      )}
      <span className="sr-only">
        {hasScore ? `Composite score ${score} out of 100` : "Not scored"}
        {sectorAverage != null && `, sector average ${sectorAverage}`}
      </span>
      {showLabel && (
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            key={score}
            className="enter-fade font-[family-name:var(--font-bebas)] leading-none text-foreground"
            style={{ fontSize: size * 0.32 }}
          >
            {hasScore ? score : "N/A"}
          </span>
        </div>
      )}
    </div>
  )
}
