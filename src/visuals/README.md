# Visual System (Course 1: Preflop)

Reusable SVG chart components and tokens for consistent visuals.

## Tokens
- `visualTokens.ts` defines the shared palette, typography, and sizing.
- `visuals.css` maps the palette to CSS variables for SVG classes.

## Components
- `ChartFrame` provides the standard background, title/subtitle, padding, and typography.
- `RangeBarChart` implements the most common bar-style chart pattern used in preflop lessons.

## Usage
```tsx
import { RangeBarChart } from '../visuals'

<RangeBarChart
  title="RFI Width by Position"
  subtitle="Tight early, widest on the Button."
  bars=[
    { label: 'UTG / EP', value: 24 },
    { label: 'HJ / MP', value: 34 },
    { label: 'CO', value: 44 },
    { label: 'BTN', value: 56 },
  ]
/>
```

For new charts, start with `ChartFrame` and stick to the tokens so colors + typography stay consistent.
