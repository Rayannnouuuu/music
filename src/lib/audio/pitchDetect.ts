const RMS_THRESHOLD = 0.01
const CORRELATION_THRESHOLD = 0.9
const MIN_FREQUENCY = 60
const MAX_FREQUENCY = 1500

function rms(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  return Math.sqrt(sum / buffer.length)
}

function normalizedCorrelationAt(buffer: Float32Array, lag: number): number {
  if (lag < 1 || lag >= buffer.length) return 0
  let sumProduct = 0
  let sumSquaresA = 0
  let sumSquaresB = 0
  for (let i = 0; i < buffer.length - lag; i++) {
    const a = buffer[i]
    const b = buffer[i + lag]
    sumProduct += a * b
    sumSquaresA += a * a
    sumSquaresB += b * b
  }
  const denom = Math.sqrt(sumSquaresA * sumSquaresB)
  return denom > 0 ? sumProduct / denom : 0
}

// Normalized autocorrelation with parabolic interpolation around the best lag.
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  if (rms(buffer) < RMS_THRESHOLD) return null

  const maxLag = Math.min(buffer.length - 1, Math.floor(sampleRate / MIN_FREQUENCY))
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQUENCY))

  // Stop at the first peak above threshold (the fundamental) instead of scanning
  // for a global max — for a clean tone, harmonics at 2x/3x/... the true period
  // can score an equal-or-higher correlation purely from integer-lag rounding luck.
  let bestLag = -1
  let bestCorrelation = 0
  let lastCorrelation = 1
  let foundGoodCorrelation = false

  for (let lag = minLag; lag <= maxLag; lag++) {
    const correlation = normalizedCorrelationAt(buffer, lag)
    if (correlation > CORRELATION_THRESHOLD && correlation > lastCorrelation) {
      foundGoodCorrelation = true
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    } else if (foundGoodCorrelation) {
      break
    }
    lastCorrelation = correlation
  }

  if (bestLag === -1) return null

  const y1 = normalizedCorrelationAt(buffer, bestLag - 1)
  const y2 = bestCorrelation
  const y3 = normalizedCorrelationAt(buffer, bestLag + 1)
  const denom = y1 - 2 * y2 + y3
  const shift = denom !== 0 ? 0.5 * (y1 - y3) / denom : 0
  const refinedLag = bestLag + shift

  return sampleRate / refinedLag
}
