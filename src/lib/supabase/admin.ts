import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Message explicite si la config serveur Supabase est incomplète. */
export function getAdminClientConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'NEXT_PUBLIC_SUPABASE_URL manquante sur le serveur (Vercel → Environment Variables).'
  }
  if (!getServiceRoleKey()) {
    return (
      'SUPABASE_SERVICE_KEY manquante sur le serveur. ' +
      'Ajoutez-la dans Vercel → Settings → Environment Variables ' +
      '(nom exact : SUPABASE_SERVICE_KEY), puis redéployez.'
    )
  }
  return null
}

export function createAdminClient(): SupabaseClient | null {
  const configError = getAdminClientConfigError()
  if (configError) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getServiceRoleKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
