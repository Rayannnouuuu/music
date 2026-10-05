export interface ResourceCategory {
  title: string
  tip: string
  links: { label: string; url: string }[]
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    title: 'Technique générale',
    tip: "Travaille toujours avec un métronome, même lentement : la régularité compte plus que la vitesse au début.",
    links: [
      { label: 'JustinGuitar — cours structurés gratuits', url: 'https://www.justinguitar.com' },
      { label: 'Marty Music (YouTube)', url: 'https://www.youtube.com/@MartyMusic' },
    ],
  },
  {
    title: 'Théorie musicale appliquée à la guitare',
    tip: "Comprendre les gammes et les modes t'aide à improviser des riffs, pas seulement à les recopier.",
    links: [
      { label: 'Rick Beato (YouTube)', url: 'https://www.youtube.com/@RickBeato' },
      { label: 'Paul Davids (YouTube)', url: 'https://www.youtube.com/@PaulDavids' },
    ],
  },
  {
    title: 'Spécifique metal (palm muting, riffs rythmiques, accordages abaissés)',
    tip: "Pour un palm mute propre, pose le tranchant de la paume juste devant le chevalet et garde une pression constante.",
    links: [
      { label: 'Ola Englund (YouTube)', url: 'https://www.youtube.com/@OlaEnglund' },
      {
        label: "Bradley Hall's Guitar School (YouTube)",
        url: 'https://www.youtube.com/@bradleyhallsguitarschool',
      },
    ],
  },
  {
    title: 'Matériel / son (ampli, pédales, réglages de base)',
    tip: "Avant d'acheter des pédales, apprends à bien régler les gains et l'EQ de ton ampli : ça change déjà énormément le son.",
    links: [
      { label: 'That Pedal Show (YouTube)', url: 'https://www.youtube.com/@ThatPedalShow' },
      { label: 'Rhett Shull (YouTube)', url: 'https://www.youtube.com/@RhettShull' },
    ],
  },
]
