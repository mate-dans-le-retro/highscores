import { createClient } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const MIN_PASSWORD_LENGTH = 6

/**
 * Sets the signed-in user's password via the service role.
 *
 * Used when Highscores Auth rejects updateUser({ password }) with
 * current_password_required for a Google-only account that has an
 * encrypted_password hash the volunteer never chose (or forgot). The access
 * token already proves the Google session; we only update that same user id.
 */
export const setOwnPasswordWithServiceRole = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      password: z.string().min(MIN_PASSWORD_LENGTH),
      accessToken: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error('Missing server Supabase config for password set.')
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await admin.auth.getUser(
      data.accessToken,
    )
    if (userError) throw userError
    const userId = userData.user.id
    if (!userId) throw new Error('Unauthorized')

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: data.password,
    })
    if (error) throw error
    return { ok: true as const }
  })
