'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import { mediaUrls } from '@/lib/media'
import { sortAlphaBy } from '@/lib/sort'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type StaffProfile = {
  id: string
  nom: string
  pin: string
  role: string
  actif: boolean
  created_at: string
}

const MASTER_PIN = '27073518'
const MASTER_KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

const ROLE_OPTIONS = sortAlphaBy(
  [
    { value: 'admin', label: 'Administrateur' },
    { value: 'chef', label: 'Chef de Salle' },
    { value: 'cm', label: 'Community Manager' },
    { value: 'livreur', label: 'Chef Livreur' },
  ],
  (r) => r.label,
)

const ROLE_STYLES: Record<string, { label: string; color: string; avatar: string }> = {
  admin: {
    label: 'Administrateur',
    color: 'text-tc-gold',
    avatar: 'bg-tc-gold/15 text-tc-gold border border-tc-gold/20',
  },
  chef: {
    label: 'Chef de Salle',
    color: 'text-blue-400',
    avatar: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  cm: {
    label: 'Community Manager',
    color: 'text-purple-400',
    avatar: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  },
  livreur: {
    label: 'Chef Livreur',
    color: 'text-orange-400',
    avatar: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  },
}

const FORM_LABEL_CLASS = 'mb-2 block text-xs uppercase tracking-widest text-white/40'

const FORM_INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-tc-cream placeholder:text-white/20 outline-none focus:border-tc-gold/40 transition'

const FORM_SELECT_CLASS =
  'w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-tc-cream outline-none focus:border-tc-gold/40 transition appearance-none cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-tc-cream'

function PinDots({
  length,
  max = 8,
  error,
}: {
  length: number
  max?: number
  error?: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors duration-200',
            i < length
              ? error
                ? 'bg-red-500'
                : 'bg-tc-gold'
              : error
                ? 'bg-red-500/30'
                : 'bg-white/15',
          )}
        />
      ))}
    </div>
  )
}

export default function StaffAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [masterPin, setMasterPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [profiles, setProfiles] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StaffProfile | null>(null)
  const [form, setForm] = useState<{ nom: string; pin: string; role: string; actif: boolean }>({
    nom: '',
    pin: '',
    role: 'chef',
    actif: true,
  })
  const [saving, setSaving] = useState(false)

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('staff_profiles').select('*').order('nom')
    setProfiles((data as StaffProfile[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) void fetchProfiles()
  }, [authed, fetchProfiles])

  const submitMasterPin = useCallback((value: string) => {
    if (value === MASTER_PIN) {
      setAuthed(true)
      setMasterPin('')
      setPinError(false)
      return
    }

    setPinError(true)
    window.setTimeout(() => {
      setMasterPin('')
      setPinError(false)
    }, 500)
  }, [])

  useEffect(() => {
    if (masterPin.length === 8) submitMasterPin(masterPin)
  }, [masterPin, submitMasterPin])

  const appendDigit = (digit: string) => {
    if (masterPin.length >= 8 || pinError) return
    setMasterPin((prev) => prev + digit)
  }

  const clearPin = () => {
    setMasterPin('')
    setPinError(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ nom: '', pin: '', role: 'chef', actif: true })
    setModal('create')
  }

  const openEdit = (profile: StaffProfile) => {
    setEditing(profile)
    setForm({
      nom: profile.nom,
      pin: profile.pin,
      role: profile.role,
      actif: profile.actif,
    })
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setEditing(null)
    setForm({ nom: '', pin: '', role: 'chef', actif: true })
  }

  const saveProfile = async () => {
    if (!form.nom.trim() || form.pin.length < 4) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      nom: form.nom.trim(),
      pin: form.pin,
      role: form.role,
      actif: form.actif,
    }

    if (modal === 'edit' && editing) {
      const { error } = await supabase.from('staff_profiles').update(payload).eq('id', editing.id)
      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('staff_profiles').insert(payload)
      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    }

    await fetchProfiles()
    closeModal()
    setSaving(false)
  }

  const deleteProfile = async (id: string) => {
    if (!window.confirm('Supprimer ce profil ?')) return
    const supabase = createClient()
    await supabase.from('staff_profiles').delete().eq('id', id)
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  const handleLogout = () => {
    setAuthed(false)
    setMasterPin('')
    setPinError(false)
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <Image
          src={mediaUrls.logos.restaurant1}
          alt="The Canteen's"
          width={192}
          height={64}
          className="mb-2 h-16 w-48 object-contain brightness-0 invert"
          priority
        />
        <div className="mx-auto mb-6 h-px w-12 bg-tc-gold/40" />
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/25">
          Gestion du Staff
        </p>
        <p className="mt-3 text-[10px] tracking-widest text-white/20">
          Accès restreint — Code administrateur
        </p>

        <PinDots length={masterPin.length} max={8} error={pinError} />

        <Lock className="mt-12 h-12 w-12 text-white/20" strokeWidth={1.25} aria-hidden />

        <div className="mt-10 flex flex-col gap-3">
          {MASTER_KEYPAD.map((row) => (
            <div key={row.join('-')} className="flex justify-center gap-3">
              {row.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-light text-tc-cream transition-colors hover:bg-white/[0.07]"
                >
                  {digit}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-light text-tc-cream transition-colors hover:bg-white/[0.07]"
            >
              0
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={clearPin}
          className="mt-8 text-xs text-white/20 transition-colors hover:text-white/40"
        >
          ← Effacer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-tc-cream">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0A0A0A] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={mediaUrls.logos.restaurant1}
            alt="The Canteen's"
            width={120}
            height={36}
            className="h-9 w-auto max-w-[140px] shrink-0 object-contain brightness-0 invert"
            priority
          />
          <div className="hidden h-4 w-px shrink-0 bg-white/10 sm:block" />
          <p className="truncate text-[10px] uppercase tracking-[0.35em] text-white/35">
            Gestion du Staff
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-white/30 transition-colors hover:text-red-400"
        >
          ⏻ Déconnexion
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <button
          type="button"
          onClick={openCreate}
          className="mb-6 rounded-xl border border-tc-gold/30 bg-tc-gold/10 px-4 py-2.5 text-sm text-tc-gold transition-colors hover:bg-tc-gold/20"
        >
          + Ajouter un profil
        </button>

        {loading ? (
          <p className="text-sm text-white/30">Chargement…</p>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-white/30">Aucun profil staff pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profiles.map((profile) => {
              const style = ROLE_STYLES[profile.role] ?? ROLE_STYLES.chef
              return (
                <div
                  key={profile.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/15"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold',
                        style.avatar,
                      )}
                    >
                      {profile.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-tc-cream">{profile.nom}</p>
                      <p className={cn('text-xs uppercase tracking-wider', style.color)}>
                        {style.label}
                      </p>
                      <p className="text-xs text-white/30">PIN : ••••</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span
                      className={cn(
                        'text-xs',
                        profile.actif ? 'text-emerald-400' : 'text-white/30',
                      )}
                    >
                      {profile.actif ? '● Actif' : '● Inactif'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(profile)}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-sm transition-colors hover:border-white/20"
                        aria-label="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProfile(profile.id)}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-sm transition-colors hover:border-red-400/30 hover:text-red-400"
                        aria-label="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-6 font-medium text-tc-cream">
              {modal === 'create' ? 'Nouveau profil' : 'Modifier le profil'}
            </h3>

            <div className="space-y-5">
              <div>
                <label className={FORM_LABEL_CLASS}>Nom *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className={FORM_LABEL_CLASS}>Code PIN *</label>
                <input
                  type="password"
                  value={form.pin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))
                  }
                  minLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Min. 4 chiffres"
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div>
                <label className={FORM_LABEL_CLASS}>Rôle *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className={FORM_SELECT_CLASS}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:border-white/10">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm((prev) => ({ ...prev, actif: e.target.checked }))}
                  className="h-4 w-4 cursor-pointer accent-tc-gold"
                />
                <span className="text-sm text-white/60">Profil actif</span>
                <span className="ml-auto text-[10px] text-white/25">
                  {form.actif ? 'Visible au login' : 'Masqué au login'}
                </span>
              </label>

              <p className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400/80">
                ⚠️ Le PIN doit être unique et connu uniquement de la personne concernée.
              </p>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-full border border-white/10 py-2.5 text-sm text-white/50 transition hover:text-tc-cream"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving || !form.nom.trim() || form.pin.length < 4}
                className="flex-1 rounded-full bg-tc-gold py-2.5 text-sm font-bold text-tc-black transition hover:bg-tc-gold/90 disabled:opacity-40"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
