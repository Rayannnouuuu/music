import { RESOURCE_CATEGORIES } from '../content/resources'

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <h1>Ressources</h1>

      {RESOURCE_CATEGORIES.map((category) => (
        <section
          key={category.title}
          className="bg-panel border border-border rounded-lg p-4 space-y-3"
        >
          <h2 className="font-semibold">{category.title}</h2>
          <p className="text-text-muted text-sm">{category.tip}</p>
          <ul className="flex flex-wrap gap-2">
            {category.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-bg border border-border rounded px-3 py-1 text-sm text-accent hover:border-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
