export interface ScheduleInput {
  currentTime: number
  nextTickTime: number
  scheduleAheadTime: number
  secondsPerBeat: number
  beatsPerBar: number
  nextBeatIndexInBar: number
}

export interface ScheduleResult {
  ticks: { time: number; accent: boolean }[]
  nextTickTime: number
  nextBeatIndexInBar: number
}

export function computeScheduledTicks(input: ScheduleInput): ScheduleResult {
  let { nextTickTime, nextBeatIndexInBar } = input
  const { currentTime, scheduleAheadTime, secondsPerBeat, beatsPerBar } = input
  const ticks: ScheduleResult['ticks'] = []

  // A non-positive beat length can never advance nextTickTime: scheduling
  // against it would loop forever (or backwards). Treat it as "nothing to
  // schedule yet" rather than crashing.
  if (secondsPerBeat <= 0) {
    return { ticks, nextTickTime, nextBeatIndexInBar }
  }

  while (nextTickTime < currentTime + scheduleAheadTime) {
    ticks.push({ time: nextTickTime, accent: nextBeatIndexInBar === 0 })
    nextTickTime += secondsPerBeat
    nextBeatIndexInBar = (nextBeatIndexInBar + 1) % beatsPerBar
  }

  return { ticks, nextTickTime, nextBeatIndexInBar }
}

const SCHEDULE_AHEAD_TIME = 0.1
const LOOKAHEAD_INTERVAL_MS = 25
const BEATS_PER_BAR = 4
const MIN_BPM = 20
const MAX_BPM = 400

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, bpm))
}

export class MetronomeEngine {
  private audioContext: AudioContext | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private nextTickTime = 0
  private nextBeatIndexInBar = 0
  private secondsPerBeat = 60 / 90
  private volume = 0.5

  start(bpm: number): void {
    if (this.intervalId !== null) return
    this.secondsPerBeat = 60 / clampBpm(bpm)
    this.audioContext = new AudioContext()
    this.nextTickTime = this.audioContext.currentTime
    this.nextBeatIndexInBar = 0

    this.intervalId = setInterval(() => {
      if (!this.audioContext) return
      const result = computeScheduledTicks({
        currentTime: this.audioContext.currentTime,
        nextTickTime: this.nextTickTime,
        scheduleAheadTime: SCHEDULE_AHEAD_TIME,
        secondsPerBeat: this.secondsPerBeat,
        beatsPerBar: BEATS_PER_BAR,
        nextBeatIndexInBar: this.nextBeatIndexInBar,
      })
      this.nextTickTime = result.nextTickTime
      this.nextBeatIndexInBar = result.nextBeatIndexInBar
      for (const tick of result.ticks) {
        this.playClick(tick.time, tick.accent)
      }
    }, LOOKAHEAD_INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.audioContext?.close()
    this.audioContext = null
  }

  setBpm(bpm: number): void {
    this.secondsPerBeat = 60 / clampBpm(bpm)
  }

  setVolume(v: number): void {
    this.volume = v
  }

  private playClick(time: number, accent: boolean): void {
    if (!this.audioContext) return
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    oscillator.frequency.value = accent ? 1200 : 800
    gain.gain.setValueAtTime(this.volume, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    oscillator.connect(gain)
    gain.connect(this.audioContext.destination)
    oscillator.start(time)
    oscillator.stop(time + 0.05)
  }
}
