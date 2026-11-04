import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useMatches,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

export type MdlrTheme = 'arcade' | 'console' | 'scene'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** MDLR theme set on <html>: scene (public screen), arcade (phone), console (admin). */
    theme?: MdlrTheme
  }
}

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Highscores · Mate dans le Rétro… Gaming' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;800&family=Montserrat:ital,wght@0,400;0,600;0,800;1,400&family=Press+Start+2P&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function useTheme(): MdlrTheme {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const theme = matches[i].staticData.theme
    if (theme) return theme
  }
  return 'arcade'
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = useTheme()

  return (
    <html lang="fr" data-theme={theme}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        {theme !== 'scene' && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
