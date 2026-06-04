// lib/analytics/forecast.ts
// Pure TypeScript linear regression utility for KPI/KRI forecast band computation.
// No external dependencies — OLS period-index encoding (index 0..n-1).
// SERVER-SIDE ONLY: called from KPI/KRI detail server components; pass computed
// forecastBand as props to ForecastChart — never call from client components.

/**
 * Ordinary least squares linear regression on period-indexed values.
 * x-axis uses integer indices 0..n-1 (period index encoding).
 */
export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = values.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator   += (i - xMean) * (values[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope     = denominator === 0 ? 0 : numerator / denominator
  const intercept = yMean - slope * xMean
  return { slope, intercept }
}

/**
 * Compute forecast band for next `horizon` periods using residual stddev as uncertainty.
 * Returns array of { lower, upper } for each forecast period.
 * Minimum 4 readings required before calling — caller must guard.
 */
export function forecastPoints(
  readings: number[],
  horizon: number,
): { lower: number; upper: number }[] {
  const { slope, intercept } = linearRegression(readings)
  const n = readings.length

  const residuals = readings.map((v, i) => v - (intercept + slope * i))
  const residualMean = residuals.reduce((s, r) => s + r, 0) / n
  const residualStd = Math.sqrt(
    residuals.reduce((s, r) => s + (r - residualMean) ** 2, 0) / n
  )

  return Array.from({ length: horizon }, (_, h) => {
    const predicted = intercept + slope * (n + h)
    return {
      lower: predicted - residualStd,
      upper: predicted + residualStd,
    }
  })
}
