const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_FONT_SIZE = 11;
const TICK_MARGIN = 8;
const AXIS_LABEL_SPACE = 15;
const PADDING = 4;

let cachedCtx: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D {
  if (!cachedCtx) {
    const canvas = document.createElement('canvas');
    cachedCtx = canvas.getContext('2d')!;
  }
  return cachedCtx;
}

/**
 * Measures the required Y-axis width for a set of tick labels.
 *
 * Uses an offscreen canvas to measure text width, then adds space
 * for tickMargin, rotated axis label, and padding to match Recharts layout.
 */
export function measureYAxisWidth(
  tickLabels: string[],
  fontSize: number = DEFAULT_FONT_SIZE,
  hasAxisLabel: boolean = true,
): number {
  if (tickLabels.length === 0) return 0;

  const ctx = getCanvasContext();
  ctx.font = `${fontSize}px ${FONT_STACK}`;

  let maxWidth = 0;
  for (const label of tickLabels) {
    const w = ctx.measureText(label).width;
    if (w > maxWidth) maxWidth = w;
  }

  return Math.ceil(
    maxWidth + TICK_MARGIN + (hasAxisLabel ? AXIS_LABEL_SPACE : 0) + PADDING,
  );
}
