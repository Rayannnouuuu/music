import { Barbell, BookOpenText, Lightning, SpeakerHigh, Lightbulb, YoutubeLogo, ArrowSquareOut, type Icon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { RESOURCE_CATEGORIES } from '../content/resources'
import { Card } from '../components/ui/Card'
import { staggerContainer, fadeInUp } from '../lib/motion/variants'

const CATEGORY_ICONS: Record<string, Icon> = {
  'Technique générale': Barbell,
  'Théorie musicale appliquée à la guitare': BookOpenText,
  'Spécifique metal (palm muting, riffs rythmiques, accordages abaissés)': Lightning,
  'Matériel / son (ampli, pédales, réglages de base)': SpeakerHigh,
}

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ressources</h1>
        <p className="mt-1 text-text-muted">Des liens choisis pour progresser au-delà du site.</p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-5 lg:grid-cols-2"
      >
        {RESOURCE_CATEGORIES.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category.title] ?? BookOpenText
          return (
            <motion.div key={category.title} variants={fadeInUp}>
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <CategoryIcon size={19} />
                  </span>
                  <h2 className="font-semibold text-text">{category.title}</h2>
                </div>

                <div className="flex gap-2 rounded-[var(--radius-input)] border-l-2 border-accent bg-panel-raised p-3 text-sm text-text-muted">
                  <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent-strong" />
                  <p>{category.tip}</p>
                </div>

                <ul className="space-y-1.5">
                  {category.links.map((link) => {
                    const isYoutube = link.url.includes('youtube.com')
                    return (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2.5 rounded-[var(--radius-input)] border border-border-soft bg-panel px-3 py-2.5 text-sm text-text transition-colors hover:border-accent-soft hover:text-accent-strong"
                        >
                          {isYoutube ? (
                            <YoutubeLogo size={17} className="shrink-0 text-text-muted" />
                          ) : (
                            <ArrowSquareOut size={15} className="shrink-0 text-text-muted" />
                          )}
                          <span className="flex-1">{link.label}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
