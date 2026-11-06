import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useMatches,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { DemoWatermark } from '#/components/demo-watermark'
import { adminAppearanceToTheme, useAdminAppearance } from '#/lib/admin-theme'

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
      { name: 'theme-color', content: '#331655' },
      { name: 'msapplication-TileColor', content: '#331655' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96x96.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/android-chrome-192x192.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
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

function useRouteTheme(): MdlrTheme {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const theme = matches[i].staticData.theme
    if (theme) return theme
  }
  return 'arcade'
}

/** Admin routes declare `console`; honor the clair/sombre preference on top. */
function useTheme(): MdlrTheme {
  const routeTheme = useRouteTheme()
  const appearance = useAdminAppearance()
  if (routeTheme === 'console') return adminAppearanceToTheme(appearance)
  return routeTheme
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
        <DemoWatermark />
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
