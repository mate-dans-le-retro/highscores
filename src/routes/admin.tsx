import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  staticData: { theme: 'console' },
  component: Admin,
})

function Admin() {
  return (
    <main className="mx-auto flex max-w-[1024px] flex-col gap-6 px-6 py-12">
      <h1 className="text-h2">Admin MDLR</h1>
      <p className="text-body-ui text-ink-secondary">
        Connexion des bénévoles, gestion des jeux et validation des scores : à
        venir.
      </p>
    </main>
  )
}
