import type { ReactNode } from 'react'
import { visualSizing, visualTypography } from './visualTokens'

export type ChartFrameProps = {
  title: string
  subtitle?: string
  width?: number
  height?: number
  ariaLabel?: string
  children: ReactNode
}

export function ChartFrame({
  title,
  subtitle,
  width = 900,
  height = 320,
  ariaLabel,
  children,
}: ChartFrameProps) {
  return (
    <svg
      className="chart-frame"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel ?? title}
    >
      <rect className="chart-frame__bg" width={width} height={height} rx={visualSizing.radius} />
      <text
        className="chart-frame__title"
        x={visualSizing.paddingX}
        y={visualSizing.paddingY - 8}
        fontFamily={visualTypography.family}
        fontSize={visualTypography.titleSize}
        fontWeight={700}
      >
        {title}
      </text>
      {subtitle ? (
        <text
          className="chart-frame__subtitle"
          x={visualSizing.paddingX}
          y={visualSizing.paddingY + 18}
          fontFamily={visualTypography.family}
          fontSize={visualTypography.subtitleSize}
        >
          {subtitle}
        </text>
      ) : null}
      <g transform={`translate(${visualSizing.paddingX}, ${visualSizing.paddingY + 40})`}>
        {children}
      </g>
    </svg>
  )
}
