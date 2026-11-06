import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  ADMIN_WARN_AFTER_MS,
  realtimeFallbackInterval,
  useHighscoresRealtime,
} from '#/lib/highscores'

const AdminRealtimeContext = createContext<number | false>(
  realtimeFallbackInterval('disconnected'),
)

/** Poll interval for admin queries: false while Realtime is live, 10 s when down. */
export function useAdminRefetchInterval() {
  return useContext(AdminRealtimeContext)
}

/** Preview the 60 s warning without waiting (`?realtimeWarn=1`). */
function previewWarnFromSearch() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('realtimeWarn') === '1'
}

/**
 * Subscribes the admin shell to change_signals (same channel as the public
 * screen). Warns once after 60 s disconnected; keeps polling, never reloads.
 */
export function AdminRealtimeProvider({ children }: { children: ReactNode }) {
  const [warnOpen, setWarnOpen] = useState(false)
  const onDisconnectedTooLong = useCallback(() => setWarnOpen(true), [])
  const status = useHighscoresRealtime({
    warnAfterMs: ADMIN_WARN_AFTER_MS,
    onDisconnectedTooLong,
  })
  const refetchInterval = realtimeFallbackInterval(status)

  useEffect(() => {
    if (previewWarnFromSearch()) setWarnOpen(true)
  }, [])

  return (
    <AdminRealtimeContext.Provider value={refetchInterval}>
      {children}
      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion temps réel perdue</DialogTitle>
            <DialogDescription>
              On n'arrive plus à suivre les mises à jour en direct. La page
              continue de se synchroniser toute seule toutes les 10 secondes :
              pas besoin de la recharger. Tu peux laisser l'onglet ouvert.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setWarnOpen(false)}>
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminRealtimeContext.Provider>
  )
}
