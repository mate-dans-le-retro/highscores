import { useMutation, useQuery } from '@tanstack/react-query'

import { InstagramPanel } from '#/components/admin/instagram-panel'
import { useAdminRefetchInterval } from '#/components/admin/realtime-provider'
import {
  anonymousSeedsQuery,
  approvedScoresQuery,
  eventsQuery,
  proofUrl,
  setInstagramPostId,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { AdminGame, AdminScore } from '#/lib/admin'
import {
  buildInstagramPost,
  manualPostDate,
  manualPostId,
} from '#/lib/instagram-post'

/** Instagram panel of an approved submission whose player agreed to a post. */
export function ScoreInstagram({
  submission,
  game,
}: {
  submission: AdminScore
  game: AdminGame
}) {
  const anonymous = !submission.display_on_screen
  const refetchInterval = useAdminRefetchInterval()
  const approved = useQuery({ ...approvedScoresQuery, refetchInterval })
  const events = useQuery({ ...eventsQuery, refetchInterval })
  const seeds = useQuery({
    ...anonymousSeedsQuery,
    enabled: anonymous,
    refetchInterval,
  })
  const invalidate = useInvalidateAdmin()
  const mark = useMutation({
    mutationFn: (posted: boolean) =>
      setInstagramPostId(submission.id, posted ? manualPostId() : null),
    onSuccess: invalidate,
  })

  // Wait for the nickname of the screen rather than show another one.
  if (!approved.data || (anonymous && seeds.isPending)) {
    return (
      <p className="text-body-sm text-ink-secondary">
        Préparation de la publication…
      </p>
    )
  }

  const post = buildInstagramPost({
    score: submission,
    game,
    eventName:
      events.data?.find(({ id }) => id === submission.event_id)?.name ?? null,
    approved: approved.data,
    anonymousSeed: seeds.data?.get(submission.id),
  })
  const postId = mark.isPending
    ? mark.variables
      ? manualPostId()
      : null
    : submission.instagram_post_id

  return (
    <InstagramPanel
      post={post}
      photoUrl={proofUrl(submission.photo_path)}
      status={
        postId
          ? { posted: true, at: manualPostDate(postId) }
          : { posted: false }
      }
      onPostedChange={(posted) => mark.mutate(posted)}
      saving={mark.isPending}
      saveFailed={mark.isError}
    />
  )
}
