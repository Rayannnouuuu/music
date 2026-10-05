export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6 // 1 = high e, 6 = low E

export type Technique = 'bend' | 'slide' | 'palmMute' | 'hammer' | 'pull' | 'vibrato'

export interface TabEvent {
  string: GuitarString
  fret: number
  startBeat: number
  duration: number
  technique?: Technique
}

export interface Measure {
  events: TabEvent[]
}

export type Category =
  | 'scales'
  | 'legato'
  | 'picking'
  | 'bends'
  | 'palmMuting'
  | 'sweep'
  | 'rhythm'
  | 'arpeggios'

export interface Tab {
  id: string
  title: string
  artist: string
  subgenre: string
  tuning: string
  originalTempo: number
  difficulty: number
  measures: Measure[]
}

export interface Exercise {
  id: string
  title: string
  category: Category
  difficulty: number
  description: string
  targetBpm: number
  xpReward: number
  pattern: TabEvent[]
}
