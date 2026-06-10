'use client'

import { useMemo, useRef, useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { Send, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sortAlphaBy, sortAlphaStrings } from '@/lib/sort'
import { createClient } from '@/lib/supabase/client'

const buffetOptions = [
  {
    id: 'finger-food',
    labelFr: 'Formule Finger Food',
    labelEn: 'Finger Food Package',
    descFr: 'Mini burgers, nems, brochettes, pain à l\'ail — idéal pour cocktail & afterwork',
    descEn: 'Mini burgers, spring rolls, skewers, garlic bread — ideal for cocktails & afterwork',
    priceFr: '5 000 FCFA / pers.',
    priceEn: '5,000 FCFA / person',
  },
  {
    id: 'brunch',
    labelFr: 'Formule Brunch',
    labelEn: 'Brunch Package',
    descFr: 'Viennoiseries, plats chauds (Ndolé, Gombo, Poulet), salades, desserts maison',
    descEn: 'Pastries, hot dishes (Ndolé, Gombo, Chicken), salads, homemade desserts',
    priceFr: '10 000 FCFA / pers.',
    priceEn: '10,000 FCFA / person',
  },
  {
    id: 'diner-buffet',
    labelFr: 'Formule Dîner Buffet',
    labelEn: 'Dinner Buffet Package',
    descFr: 'Entrées (carpaccio, salades), grillades & plats chauds, accompagnements, desserts',
    descEn: 'Starters (carpaccio, salads), grills & hot dishes, sides, desserts',
    priceFr: 'Prix sur devis',
    priceEn: 'Price on request',
  },
  {
    id: 'premium',
    labelFr: 'Formule Premium',
    labelEn: 'Premium Package',
    descFr: 'Buffet complet + sélection de vins + cocktails signature + desserts maison',
    descEn: 'Full buffet + wine selection + signature cocktails + homemade desserts',
    priceFr: 'Prix sur devis',
    priceEn: 'Price on request',
  },
  {
    id: 'devis',
    labelFr: 'Devis personnalisé',
    labelEn: 'Custom quote',
    descFr: 'Je souhaite discuter d\'un menu sur mesure avec l\'équipe',
    descEn: 'I would like to discuss a custom menu with the team',
    priceFr: '',
    priceEn: '',
  },
]

const eventTypes = {
  fr: sortAlphaStrings([
    'Dîner classique', 'Anniversaire', 'Dîner romantique', 'Réunion corporate', 'Soirée privée', 'Brunch', 'Autre',
  ]),
  en: sortAlphaStrings([
    'Classic dinner', 'Birthday', 'Romantic dinner', 'Corporate meeting', 'Private party', 'Brunch', 'Other',
  ], 'en'),
}

const spaces = {
  fr: sortAlphaStrings(['Restaurant', 'Lounge', 'Terrasse', 'Plusieurs espaces']),
  en: sortAlphaStrings(['Restaurant', 'Lounge', 'Terrace', 'Multiple spaces'], 'en'),
}

const animations = {
  fr: sortAlphaStrings(['Sans animation', 'DJ', 'Karaoké', 'Live Music', 'À discuter']),
  en: sortAlphaStrings(['No entertainment', 'DJ', 'Karaoke', 'Live Music', 'To be discussed'], 'en'),
}

const budgets = {
  fr: sortAlphaStrings([
    '< 50 000 FCFA', '50 000 – 150 000 FCFA', '150 000 – 300 000 FCFA', '> 300 000 FCFA', 'Préfère ne pas indiquer',
  ]),
  en: sortAlphaStrings([
    '< 50,000 FCFA', '50,000 – 150,000 FCFA', '150,000 – 300,000 FCFA', '> 300,000 FCFA', 'Prefer not to say',
  ], 'en'),
}

interface FormData {
  nom: string
  telephone: string
  email: string
  date: string
  heure: string
  personnes: string
  espace: string
  typeEvenement: string
  titreEvenement: string
  buffet: boolean
  buffetFormule: string
  animation: string
  allergies: string
  budget: string
  message: string
}

const initial: FormData = {
  nom: '',
  telephone: '',
  email: '',
  date: '',
  heure: '',
  personnes: '',
  espace: '',
  typeEvenement: '',
  titreEvenement: '',
  buffet: false,
  buffetFormule: '',
  animation: '',
  allergies: '',
  budget: '',
  message: '',
}

function buildWhatsAppMessage(f: FormData, locale: string): string {
  const isFr = locale === 'fr'
  const buffetLabel = f.buffet
    ? buffetOptions.find(b => b.id === f.buffetFormule)?.[isFr ? 'labelFr' : 'labelEn'] ?? '—'
    : isFr ? 'Non' : 'No'

  if (isFr) {
    return encodeURIComponent(
      `🍽️ *DEMANDE DE RÉSERVATION — THE CANTEEN'S*\n\n` +
      `👤 *Nom :* ${f.nom}\n` +
      `📱 *Téléphone :* ${f.telephone}\n` +
      `📧 *Email :* ${f.email || '—'}\n\n` +
      `📅 *Date :* ${f.date}\n` +
      `🕐 *Heure :* ${f.heure}\n` +
      `👥 *Nombre de personnes :* ${f.personnes}\n` +
      `🏠 *Espace :* ${f.espace}\n\n` +
      `🎉 *Type d'événement :* ${f.typeEvenement}\n` +
      `✨ *Titre / thème :* ${f.titreEvenement || '—'}\n\n` +
      `🍴 *Buffet :* ${buffetLabel}\n` +
      `🎵 *Animation :* ${f.animation || '—'}\n\n` +
      `⚠️ *Allergies / restrictions :* ${f.allergies || '—'}\n` +
      `💰 *Budget indicatif :* ${f.budget || '—'}\n\n` +
      `💬 *Message :* ${f.message || '—'}\n\n` +
      `_Envoyé depuis le formulaire de réservation The Canteen's_`
    )
  }
  return encodeURIComponent(
    `🍽️ *RESERVATION REQUEST — THE CANTEEN'S*\n\n` +
    `👤 *Name :* ${f.nom}\n` +
    `📱 *Phone :* ${f.telephone}\n` +
    `📧 *Email :* ${f.email || '—'}\n\n` +
    `📅 *Date :* ${f.date}\n` +
    `🕐 *Time :* ${f.heure}\n` +
    `👥 *Guests :* ${f.personnes}\n` +
    `🏠 *Space :* ${f.espace}\n\n` +
    `🎉 *Event type :* ${f.typeEvenement}\n` +
    `✨ *Title / theme :* ${f.titreEvenement || '—'}\n\n` +
    `🍴 *Buffet :* ${buffetLabel}\n` +
    `🎵 *Entertainment :* ${f.animation || '—'}\n\n` +
    `⚠️ *Allergies / dietary :* ${f.allergies || '—'}\n` +
    `💰 *Estimated budget :* ${f.budget || '—'}\n\n` +
    `💬 *Message :* ${f.message || '—'}\n\n` +
    `_Sent from The Canteen's reservation form_`
  )
}

const inputClass = 'w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-tc-cream placeholder-tc-cream/20 focus:border-tc-gold/50 focus:outline-none transition-colors'
const labelClass = 'mb-2 block text-xs uppercase tracking-widest text-tc-cream/40'
const sectionTitleClass = 'mb-6 text-xs uppercase tracking-[0.3em] text-tc-gold/60'
const errorMessageClass = 'mt-1.5 flex items-center gap-1.5 text-xs text-red-400 animate-in slide-in-from-top-1'

const errorMessagesFr: Record<string, string> = {
  nom: 'Veuillez indiquer votre nom',
  telephone: 'Veuillez indiquer votre numéro de téléphone',
  date: 'Veuillez choisir une date',
  heure: "Veuillez indiquer une heure d'arrivée",
  espace: 'Veuillez choisir un espace',
  personnes: 'Veuillez indiquer le nombre de personnes',
  typeEvenement: "Veuillez choisir un type d'événement",
  buffetFormule: 'Veuillez choisir une formule buffet',
}

const errorMessagesEn: Record<string, string> = {
  nom: 'Please enter your name',
  telephone: 'Please enter your phone number',
  date: 'Please choose a date',
  heure: 'Please enter an arrival time',
  espace: 'Please choose a space',
  personnes: 'Please enter the number of guests',
  typeEvenement: 'Please choose an event type',
  buffetFormule: 'Please choose a buffet package',
}

const ESPACE_SLUG_MAP: Record<string, { fr: string; en: string }> = {
  restaurant: { fr: 'Restaurant', en: 'Restaurant' },
  lounge: { fr: 'Lounge', en: 'Lounge' },
  terrasse: { fr: 'Terrasse', en: 'Terrace' },
}

export function resolveEspaceFromSlug(
  slug: string | undefined,
  locale: string,
): string {
  if (!slug) return ''
  const entry = ESPACE_SLUG_MAP[slug.toLowerCase()]
  if (!entry) return ''
  return locale === 'fr' ? entry.fr : entry.en
}

export default function ReservationForm({
  locale,
  defaultEspace,
}: {
  locale: string
  defaultEspace?: string
}) {
  const isFr = locale === 'fr'
  const errorMessages = isFr ? errorMessagesFr : errorMessagesEn
  const sortedBuffetOptions = useMemo(
    () => sortAlphaBy(buffetOptions, (o) => (isFr ? o.labelFr : o.labelEn)),
    [isFr],
  )
  const prefilledEspace = resolveEspaceFromSlug(defaultEspace, locale)
  const [form, setForm] = useState<FormData>(() => ({
    ...initial,
    espace: prefilledEspace,
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [sent, setSent] = useState(false)
  const nomRef = useRef<HTMLDivElement>(null)
  const telephoneRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const heureRef = useRef<HTMLDivElement>(null)
  const personnesRef = useRef<HTMLDivElement>(null)
  const espaceRef = useRef<HTMLDivElement>(null)
  const typeEvenementRef = useRef<HTMLDivElement>(null)
  const buffetFormuleRef = useRef<HTMLDivElement>(null)

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const fieldErrorClass = (hasError: boolean) =>
    hasError ? 'border-red-500/40 focus:border-red-500/50' : ''

  const required: (keyof FormData)[] = ['nom', 'telephone', 'date', 'heure', 'personnes', 'espace', 'typeEvenement']

  const handleSubmit = async () => {
    const newErrors: Partial<Record<keyof FormData, boolean>> = {}
    required.forEach((k) => {
      const value = form[k]
      if (!value?.toString().trim()) newErrors[k] = true
    })
    if (form.buffet && !form.buffetFormule) newErrors.buffetFormule = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const fieldRefs: Record<string, RefObject<HTMLDivElement | null>> = {
        nom: nomRef,
        telephone: telephoneRef,
        date: dateRef,
        heure: heureRef,
        personnes: personnesRef,
        espace: espaceRef,
        typeEvenement: typeEvenementRef,
        buffetFormule: buffetFormuleRef,
      }
      const scrollOrder = ['nom', 'telephone', 'date', 'heure', 'personnes', 'espace', 'typeEvenement', 'buffetFormule']
      const firstError = scrollOrder.find((f) => newErrors[f as keyof FormData])
      if (firstError && fieldRefs[firstError]?.current) {
        fieldRefs[firstError].current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('reservations').insert({
      nom: form.nom,
      telephone: form.telephone,
      email: form.email || null,
      date_souhaitee: form.date,
      heure_arrivee: form.heure,
      nombre_personnes: parseInt(form.personnes, 10),
      espace: form.espace,
      type_evenement: form.typeEvenement || null,
      titre_theme: form.titreEvenement || null,
      buffet_souhaite: form.buffet,
      formule_buffet: form.buffet ? form.buffetFormule : null,
      animation: form.animation || 'sans',
      allergies: form.allergies || null,
      budget: form.budget || null,
      message: form.message || null,
      statut: 'nouveau',
    })

    if (error) {
      console.error('Supabase insert error:', error)
    }

    const msg = buildWhatsAppMessage(form, locale)
    window.open(`https://api.whatsapp.com/send?phone=237655867084&text=${msg}`, '_blank')
    setSent(true)
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 py-20 text-center"
      >
        <CheckCircle size={48} className="text-tc-gold" />
        <h3 className="font-serif text-3xl text-tc-cream">
          {isFr ? 'Demande envoyée !' : 'Request sent!'}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-tc-cream/50">
          {isFr
            ? 'Votre demande a été transmise via WhatsApp. Notre équipe vous confirme votre réservation sous 30 minutes.'
            : 'Your request has been sent via WhatsApp. Our team will confirm your booking within 30 minutes.'}
        </p>
        <button
          onClick={() => { setForm(initial); setSent(false) }}
          className="border border-white/10 px-6 py-3 text-xs uppercase tracking-widest text-tc-cream/50 transition-colors hover:border-tc-gold/30 hover:text-tc-gold"
        >
          {isFr ? 'Nouvelle réservation' : 'New reservation'}
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mx-auto max-w-3xl"
    >
      <div className="glass border border-white/10 p-8 sm:p-12">

        {/* Section 1 — Informations personnelles */}
        <div className="mb-10">
          <p className={sectionTitleClass}>
            {isFr ? '01 — Vos informations' : '01 — Your information'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div ref={nomRef}>
              <label className={cn(labelClass, errors.nom && 'text-red-400')}>
                {isFr ? 'Nom complet' : 'Full name'} *
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={e => { set('nom', e.target.value); setErrors(p => ({ ...p, nom: false })) }}
                placeholder={isFr ? 'Jean-Pierre Mballa' : 'John Doe'}
                className={cn(inputClass, fieldErrorClass(!!errors.nom))}
              />
              {errors.nom && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.nom}
                </p>
              )}
            </div>
            <div ref={telephoneRef}>
              <label className={cn(labelClass, errors.telephone && 'text-red-400')}>
                {isFr ? 'Téléphone WhatsApp' : 'WhatsApp phone'} *
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => { set('telephone', e.target.value); setErrors(p => ({ ...p, telephone: false })) }}
                placeholder="+237 6XX XXX XXX"
                className={cn(inputClass, fieldErrorClass(!!errors.telephone))}
              />
              {errors.telephone && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.telephone}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email {isFr ? '(optionnel)' : '(optional)'}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@exemple.com"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="mb-10 border-t border-white/5 pt-10">
          <p className={sectionTitleClass}>
            {isFr ? '02 — Détails de la réservation' : '02 — Booking details'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div ref={dateRef}>
              <label className={cn(labelClass, errors.date && 'text-red-400')}>
                {isFr ? 'Date souhaitée' : 'Desired date'} *
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { set('date', e.target.value); setErrors(p => ({ ...p, date: false })) }}
                className={cn(inputClass, fieldErrorClass(!!errors.date))}
              />
              {errors.date && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.date}
                </p>
              )}
            </div>
            <div ref={heureRef}>
              <label className={cn(labelClass, errors.heure && 'text-red-400')}>
                {isFr ? 'Heure d\'arrivée' : 'Arrival time'} *
              </label>
              <input
                type="time"
                value={form.heure}
                onChange={e => { set('heure', e.target.value); setErrors(p => ({ ...p, heure: false })) }}
                className={cn(inputClass, fieldErrorClass(!!errors.heure))}
              />
              {errors.heure && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.heure}
                </p>
              )}
            </div>
            <div ref={personnesRef}>
              <label className={cn(labelClass, errors.personnes && 'text-red-400')}>
                {isFr ? 'Nombre de personnes' : 'Number of guests'} *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={form.personnes}
                onChange={e => { set('personnes', e.target.value); setErrors(p => ({ ...p, personnes: false })) }}
                placeholder="ex: 12"
                className={cn(inputClass, fieldErrorClass(!!errors.personnes))}
              />
              {errors.personnes && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.personnes}
                </p>
              )}
            </div>
            <div ref={espaceRef}>
              <label className={cn(labelClass, errors.espace && 'text-red-400')}>
                {isFr ? 'Espace souhaité' : 'Desired space'} *
              </label>
              <div className="relative">
                <select
                  value={form.espace}
                  onChange={e => { set('espace', e.target.value); setErrors(p => ({ ...p, espace: false })) }}
                  className={cn(inputClass, 'appearance-none pr-8 text-tc-cream', fieldErrorClass(!!errors.espace))}
                >
                  <option value="" style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
                    {isFr ? '— Choisir —' : '— Select —'}
                  </option>
                  {(isFr ? spaces.fr : spaces.en).map(s => (
                    <option
                      key={s}
                      value={s}
                      style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}
                    >
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tc-cream/30" />
              </div>
              {errors.espace && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.espace}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 — Événement */}
        <div className="mb-10 border-t border-white/5 pt-10">
          <p className={sectionTitleClass}>
            {isFr ? '03 — Votre événement' : '03 — Your event'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div ref={typeEvenementRef}>
              <label className={cn(labelClass, errors.typeEvenement && 'text-red-400')}>
                {isFr ? 'Type d\'événement' : 'Event type'} *
              </label>
              <div className="relative">
                <select
                  value={form.typeEvenement}
                  onChange={e => { set('typeEvenement', e.target.value); setErrors(p => ({ ...p, typeEvenement: false })) }}
                  className={cn(inputClass, 'appearance-none pr-8 text-tc-cream', fieldErrorClass(!!errors.typeEvenement))}
                >
                  <option value="" style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
                    {isFr ? '— Choisir —' : '— Select —'}
                  </option>
                  {(isFr ? eventTypes.fr : eventTypes.en).map(t => (
                    <option
                      key={t}
                      value={t}
                      style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}
                    >
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tc-cream/30" />
              </div>
              {errors.typeEvenement && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.typeEvenement}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                {isFr ? 'Titre / thème (déco)' : 'Title / theme (decor)'}
                <span className="ml-1 text-tc-cream/20">{isFr ? '— optionnel' : '— optional'}</span>
              </label>
              <input
                type="text"
                value={form.titreEvenement}
                onChange={e => set('titreEvenement', e.target.value)}
                placeholder={isFr ? 'ex: Anniversaire 30 ans — thème noir & or' : 'e.g. 30th birthday — black & gold theme'}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 4 — Buffet */}
        <div className="mb-10 border-t border-white/5 pt-10">
          <p className={sectionTitleClass}>
            {isFr ? '04 — Buffet' : '04 — Buffet'}
          </p>
          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm text-tc-cream/50">
              {isFr ? 'Souhaitez-vous un buffet ?' : 'Would you like a buffet?'}
            </span>
            <div className="flex gap-3">
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => { set('buffet', v); if (!v) set('buffetFormule', '') }}
                  className={cn(
                    'px-5 py-2 text-xs uppercase tracking-widest transition-all',
                    form.buffet === v
                      ? 'bg-tc-gold text-tc-black font-bold'
                      : 'border border-white/10 text-tc-cream/40 hover:border-white/30'
                  )}
                >
                  {v ? (isFr ? 'Oui' : 'Yes') : 'Non / No'}
                </button>
              ))}
            </div>
          </div>

          {form.buffet && (
            <motion.div
              ref={buffetFormuleRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-3"
            >
              {errors.buffetFormule && (
                <p className={errorMessageClass}>
                  <AlertCircle size={12} />
                  {errorMessages.buffetFormule}
                </p>
              )}
              {sortedBuffetOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { set('buffetFormule', option.id); setErrors(p => ({ ...p, buffetFormule: false })) }}
                  className={cn(
                    'flex items-start gap-4 border p-4 text-left transition-all',
                    form.buffetFormule === option.id
                      ? 'border-tc-gold/50 bg-tc-gold/5'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-all',
                    form.buffetFormule === option.id
                      ? 'border-tc-gold bg-tc-gold'
                      : 'border-white/20'
                  )} />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn(
                        'text-sm font-semibold',
                        form.buffetFormule === option.id ? 'text-tc-gold' : 'text-tc-cream'
                      )}>
                        {isFr ? option.labelFr : option.labelEn}
                      </span>
                      {(isFr ? option.priceFr : option.priceEn) && (
                        <span className="shrink-0 text-xs text-tc-cream/40">
                          {isFr ? option.priceFr : option.priceEn}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-tc-cream/40">
                      {isFr ? option.descFr : option.descEn}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Section 5 — Animation */}
        <div className="mb-10 border-t border-white/5 pt-10">
          <p className={sectionTitleClass}>
            {isFr ? '05 — Animation' : '05 — Entertainment'}
          </p>
          <div className="flex flex-wrap gap-2">
            {(isFr ? animations.fr : animations.en).map(a => (
              <button
                key={a}
                type="button"
                onClick={() => set('animation', form.animation === a ? '' : a)}
                className={cn(
                  'px-4 py-2 text-xs uppercase tracking-wider transition-all',
                  form.animation === a
                    ? 'bg-tc-gold/20 border border-tc-gold/50 text-tc-gold'
                    : 'border border-white/10 text-tc-cream/40 hover:border-white/25 hover:text-tc-cream/70'
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Section 6 — Infos complémentaires */}
        <div className="mb-10 border-t border-white/5 pt-10">
          <p className={sectionTitleClass}>
            {isFr ? '06 — Informations complémentaires' : '06 — Additional information'}
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>
                {isFr ? 'Allergies / restrictions alimentaires' : 'Allergies / dietary restrictions'}
                <span className="ml-1 text-tc-cream/20">{isFr ? '— optionnel' : '— optional'}</span>
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={e => set('allergies', e.target.value)}
                placeholder={isFr ? 'ex: intolérance lactose, végétarien...' : 'e.g. lactose intolerance, vegetarian...'}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {isFr ? 'Budget indicatif' : 'Estimated budget'}
                <span className="ml-1 text-tc-cream/20">{isFr ? '— optionnel' : '— optional'}</span>
              </label>
              <div className="relative">
                <select
                  value={form.budget}
                  onChange={e => set('budget', e.target.value)}
                  className={cn(inputClass, 'appearance-none pr-8 text-tc-cream')}
                >
                  <option value="" style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
                    {isFr ? '— Choisir —' : '— Select —'}
                  </option>
                  {(isFr ? budgets.fr : budgets.en).map(b => (
                    <option
                      key={b}
                      value={b}
                      style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}
                    >
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tc-cream/30" />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                {isFr ? 'Message complémentaire' : 'Additional message'}
                <span className="ml-1 text-tc-cream/20">{isFr ? '— optionnel' : '— optional'}</span>
              </label>
              <textarea
                value={form.message}
                onChange={e => set('message', e.target.value)}
                rows={4}
                placeholder={isFr
                  ? 'Toute information supplémentaire pour nous aider à préparer votre événement...'
                  : 'Any additional information to help us prepare your event...'}
                className={cn(inputClass, 'resize-none')}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-white/5 pt-8">
          <p className="mb-6 text-center text-xs leading-relaxed text-tc-cream/30">
            {isFr
              ? 'En cliquant sur "Envoyer", vous serez redirigé vers WhatsApp avec votre demande pré-remplie. Notre équipe vous répond sous 30 minutes.'
              : 'By clicking "Send", you will be redirected to WhatsApp with your pre-filled request. Our team will reply within 30 minutes.'}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            className="group flex w-full items-center justify-center gap-3 bg-tc-gold py-4 text-sm font-bold uppercase tracking-widest text-tc-black transition-all hover:bg-tc-gold/90 hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {isFr ? 'Envoyer ma demande via WhatsApp' : 'Send my request via WhatsApp'}
            <Send size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </motion.div>
  )
}
