import { ChartFrame } from './ChartFrame'
import { visualPalette, visualSizing, visualTypography } from './visualTokens'

type RangeBar = {
  label: string
  value: number
  color?: string
  note?: string
}

export type RangeBarChartProps = {
  title: string
  subtitle?: string
  bars: RangeBar[]
  width?: number
  height?: number
  maxValue?: number
}

export function RangeBarChart({
  title,
  subtitle,
  bars,
  width = 900,
  height = 320,
  maxValue,
}: RangeBarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((bar) => bar.value))
  const barWidth = width - visualSizing.paddingX * 2 - 170
  const rowHeight = visualSizing.barHeight + visualSizing.rowGap

  return (
    <ChartFrame title={title} subtitle={subtitle} width={width} height={height}>
      {bars.map((bar, index) => {
        const y = index * rowHeight
        const scaled = (bar.value / max) * barWidth
        const color = bar.color ?? visualPalette.accent

        return (
          <g key={bar.label} transform={`translate(0, ${y})`}>
            <text
              x={0}
              y={visualSizing.barHeight - 6}
              className="chart-frame__label"
              fontFamily={visualTypography.family}
              fontSize={visualTypography.labelSize}
            >
              {bar.label}
            </text>
            <rect
              x={140}
              y={2}
              width={barWidth}
              height={visualSizing.barHeight}
              rx={10}
              fill={visualPalette.panelAlt}
            />
            <rect
              x={140}
              y={2}
              width={Math.max(8, scaled)}
              height={visualSizing.barHeight}
              rx={10}
              fill={color}
            />
            {bar.note ? (
              <text
                x={140 + barWidth + 18}
                y={visualSizing.barHeight - 6}
                className="chart-frame__note"
                fontFamily={visualTypography.family}
                fontSize={visualTypography.noteSize}
              >
                {bar.note}
              </text>
            ) : null}
          </g>
        )
      })}
    </ChartFrame>
  )
}
