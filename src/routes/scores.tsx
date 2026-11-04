import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/scores')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
