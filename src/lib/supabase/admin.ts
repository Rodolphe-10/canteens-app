import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function isServiceRoleJwt(key: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

/** Message explicite si la config serveur Supabase est incomplète. */
export function getAdminClientConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return 'NEXT_PUBLIC_SUPABASE_URL manquante sur le serveur (Vercel → Environment Variables).'
  }
  const key = getServiceRoleKey()
  if (!key) {
    return (
      'SUPABASE_SERVICE_KEY manquante sur le serveur. ' +
      'Ajoutez-la dans Vercel → Settings → Environment Variables ' +
      '(nom exact : SUPABASE_SERVICE_KEY), puis redéployez.'
    )
  }
  if (!isServiceRoleJwt(key)) {
    return (
      'SUPABASE_SERVICE_KEY invalide : ce n\'est pas la clé service_role. ' +
      'Dans Supabase → Settings → API, copiez la clé « service_role » (secret), ' +
      'pas la clé « anon ».'
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
