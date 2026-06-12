'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  setLivreurSession,
  type LivreurSession,
} from '@/lib/livreur-session'

type LivreurRow = {
  id: string
  nom: string
  telephone: string
  photo_url: string | null
  moto_immatriculation: string
  moto_modele: string | null
  pin: string | null
  actif: boolean
}

export default function LivreurLoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [telephone, setTelephone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const tel = telephone.trim()
    if (!tel || pin.length !== 4) {
      setError('Téléphone ou PIN incorrect')
      return
    }

    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('livreurs')
        .select('id, nom, telephone, photo_url, moto_immatriculation, moto_modele, pin, actif')
        .eq('telephone', tel)
        .eq('actif', true)
        .maybeSingle()

      if (dbError || !data) {
        setError('Téléphone ou PIN incorrect')
        return
      }

      const livreur = data as LivreurRow

      if (!livreur.pin) {
        setError('Demandez votre PIN à l\'administrateur')
        return
      }

      if (livreur.pin !== pin) {
        setError('Téléphone ou PIN incorrect')
        return
      }

      const session: LivreurSession = {
        id: livreur.id,
        nom: livreur.nom,
        telephone: livreur.telephone,
        photo_url: livreur.photo_url ?? undefined,
        moto_immatriculation: livreur.moto_immatriculation,
        moto_modele: livreur.moto_modele ?? undefined,
      }
      setLivreurSession(session)
      router.push('/livreur/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 py-8">
      <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-tc-game-cyan/70">
        THE CANTEEN&apos;S
      </p>
      <p className="mb-10 text-[10px] uppercase tracking-[0.25em] text-white/30">
        Livreurs
      </p>

      <form
        onSubmit={(e) => void handleLogin(e)}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h1 className="mb-6 text-center text-lg font-medium text-tc-cream">
          Connexion
        </h1>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="telephone"
              className="mb-1 block text-xs text-white/40"
            >
              Téléphone
            </label>
            <input
              id="telephone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="677 138 318"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-tc-cream outline-none transition focus:border-tc-game-cyan/50"
            />
          </div>

          <div>
            <label htmlFor="pin" className="mb-1 block text-xs text-white/40">
              Code PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="one-time-code"
              placeholder="••••"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-mono text-lg tracking-[0.5em] text-tc-cream outline-none transition focus:border-tc-game-cyan/50"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-tc-game-cyan py-3.5 text-sm font-bold uppercase tracking-wider text-tc-black transition hover:bg-tc-game-cyan/90 disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
