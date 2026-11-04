import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  staticData: { theme: 'arcade' },
  component: Home,
})

const links = [
  {
    to: '/screen',
    label: "L'écran des highscores",
    hint: 'À projeter dans la salle',
  },
  {
    to: '/submit',
    label: 'Envoyer mon score',
    hint: 'Depuis votre téléphone',
  },
  { to: '/admin', label: 'Admin MDLR', hint: 'Pour les bénévoles' },
] as const

function Home() {
  return (
    <main className="mx-auto flex max-w-prose flex-col gap-8 px-4 py-12">
      <h1 className="font-display text-arcade-title">Highscores</h1>
      <p className="text-body text-ink-secondary">
        Vous avez explosé un record ? Prenez-vous en photo devant l'écran et
        envoyez-nous votre score !
      </p>
      <nav className="flex flex-col gap-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex flex-col gap-1 border-4 border-line-accent bg-surface-raised p-6 shadow-pixel hover:bg-surface-overlay"
          >
            <span className="text-h5">{link.label}</span>
            <span className="text-body-sm text-ink-secondary">{link.hint}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
