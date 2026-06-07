'use client'

import React from 'react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MapPin, Clock, CreditCard, User, Phone, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface DeliveryData {
  nom: string
  telephone: string
  quartier: string
  adresse: string
  repere: string
  etage: string
  instructions: string
  horaire: 'asap' | 'schedule'
  heureChoisie: string
  paiement: 'especes' | 'om' | 'momo'
  customFee?: number
  customQuartierError?: string
}

export const emptyDelivery: DeliveryData = {
  nom: '',
  telephone: '',
  quartier: '',
  adresse: '',
  repere: '',
  etage: '',
  instructions: '',
  horaire: 'asap',
  heureChoisie: '',
  paiement: 'especes',
}

// Quartiers triés par distance depuis Dragage (The Canteen's)
// ≤ 5 km → 1 000F | > 5 km → 2 000F
const quartiers = [
  // ── Proche (1 000F) ──────────────────────────────
  'Bastos',        // ~0.5 km
  'Nlongkak',      // ~1.3 km
  'Cité Verte',    // ~1.5 km
  'Santa Barbara', // ~1.8 km
  'Elig-Essono',   // ~2.0 km
  'Tsinga',        // ~2.2 km
  'Lac Municipal', // ~2.3 km
  'Centre-ville',  // ~2.5 km
  'Ngousso',       // ~2.7 km
  'Melen',         // ~2.9 km
  'Omnisport',     // ~3.1 km
  'Briqueterie',   // ~3.2 km
  'Mvog-Ada',      // ~3.4 km
  'Mokolo',        // ~3.5 km
  'Mvan',          // ~3.6 km
  'Ekoudou',       // ~3.7 km
  'Djoungolo',     // ~3.9 km
  'Obili',         // ~4.1 km
  'Essos',         // ~4.2 km
  'Etoudi',        // ~4.4 km
  // ── Lointain (2 000F) ────────────────────────────
  'Nsam',          // ~5.1 km
  'Mvog-Betsi',    // ~5.3 km
  'Mvog-Mbi',      // ~5.4 km
  'Jouvence',      // ~5.6 km
  'Mendong',       // ~5.7 km
  'Biyem-Assi',    // ~6.1 km
  'Nkolfoulou',    // ~6.5 km
  'Mimboman',      // ~6.7 km
  'Nkol-Eton',     // ~6.9 km
  'Ekounou',       // ~8.2 km
  'Ahala',         // ~8.7 km
  'Odza',          // ~10.3 km
  'Autre quartier',
]

const TC_LAT = 3.8805
const TC_LNG = 11.5108

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const CashIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
    <rect width="40" height="40" rx="6" fill="#1a7a1a"/>
    <rect x="6" y="12" width="28" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="20" cy="20" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
    <line x1="6" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1.5"/>
    <line x1="30" y1="16" x2="34" y2="16" stroke="white" strokeWidth="1.5"/>
    <line x1="6" y1="24" x2="10" y2="24" stroke="white" strokeWidth="1.5"/>
    <line x1="30" y1="24" x2="34" y2="24" stroke="white" strokeWidth="1.5"/>
  </svg>
)

const OrangeMoneyIcon = () => (
  <Image
    src="/payments/orange-money.png"
    alt="Orange Money"
    width={40}
    height={40}
    className="h-10 w-10 rounded-md object-contain"
  />
)

const MTNMoMoIcon = () => (
  <Image
    src="/payments/mtn-momo.png"
    alt="MTN Mobile Money"
    width={40}
    height={40}
    className="h-10 w-10 rounded-md object-contain"
  />
)

interface PaiementOption {
  id: 'especes' | 'om' | 'momo'
  labelFr: string
  labelEn: string
  descFr: string
  descEn: string
  icon: React.ReactNode
}

const paiementOptions: PaiementOption[] = [
  {
    id: 'especes',
    labelFr: 'Espèces',
    labelEn: 'Cash',
    descFr: 'Paiement à la livraison',
    descEn: 'Pay on delivery',
    icon: <CashIcon />,
  },
  {
    id: 'om',
    labelFr: 'Orange Money',
    labelEn: 'Orange Money',
    descFr: 'Transfert OM au livreur',
    descEn: 'OM transfer to driver',
    icon: <OrangeMoneyIcon />,
  },
  {
    id: 'momo',
    labelFr: 'MTN MoMo',
    labelEn: 'MTN MoMo',
    descFr: 'Transfert MoMo au livreur',
    descEn: 'MoMo transfer to driver',
    icon: <MTNMoMoIcon />,
  },
]

const inputClass =
  'w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-tc-cream placeholder-tc-cream/20 focus:border-tc-gold/50 focus:outline-none transition-colors'
const labelClass = 'mb-1.5 block text-[11px] uppercase tracking-widest text-tc-cream/40'

const errorMessagesFr: Record<string, string> = {
  nom: 'Veuillez indiquer votre nom',
  telephone: 'Veuillez indiquer votre numéro de téléphone',
  quartier: 'Veuillez sélectionner votre quartier',
  quartierCustom: 'Veuillez saisir et valider votre quartier',
  quartierHorsZone: 'Ce quartier est hors de notre zone de livraison (Yaoundé uniquement)',
  adresse: 'Veuillez indiquer votre adresse de livraison',
  repere: 'Veuillez indiquer un point de repère',
  heureChoisie: 'Veuillez choisir une heure de livraison',
}

const errorMessagesEn: Record<string, string> = {
  nom: 'Please enter your name',
  telephone: 'Please enter your phone number',
  quartier: 'Please select your neighborhood',
  quartierCustom: 'Please enter and validate your neighborhood',
  quartierHorsZone: 'This neighborhood is outside our delivery area (Yaoundé only)',
  adresse: 'Please enter your delivery address',
  repere: 'Please enter a landmark',
  heureChoisie: 'Please choose a delivery time',
}

interface Props {
  locale: string
  data: DeliveryData
  onChange: (data: DeliveryData) => void
  onNext: () => void
  onBack: () => void
}

export default function DeliveryForm({ locale, data, onChange, onNext, onBack }: Props) {
  const isFr = locale === 'fr'
  const errorMessages = isFr ? errorMessagesFr : errorMessagesEn
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryData, boolean>>>({})
  const nomRef = useRef<HTMLDivElement>(null)
  const telephoneRef = useRef<HTMLDivElement>(null)
  const quartierRef = useRef<HTMLDivElement>(null)
  const adresseRef = useRef<HTMLDivElement>(null)
  const repereRef = useRef<HTMLDivElement>(null)
  const heureChoisieRef = useRef<HTMLDivElement>(null)
  const [customInput, setCustomInput] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geoResult, setGeoResult] = useState<{
    distance: number
    fee: number
    label: string
  } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const set = <K extends keyof DeliveryData>(key: K, value: DeliveryData[K]) =>
    onChange({ ...data, [key]: value })

  const geocodeQuartier = async (name: string) => {
    if (name.trim().length < 3) return
    setGeocoding(true)
    setGeoResult(null)
    setGeoError(null)
    try {
      const query = encodeURIComponent(`${name} Yaoundé Cameroun`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=3&countrycodes=cm`,
        { headers: { 'Accept-Language': 'fr', 'User-Agent': 'TheCanteensApp/1.0' } },
      )
      const results = (await res.json()) as Array<{
        lat: string
        lon: string
        display_name: string
      }>

      const yaoundeResult = results.find((r) =>
        r.display_name.toLowerCase().includes('yaound'),
      )

      if (!yaoundeResult) {
        setGeoError(
          isFr
            ? 'Ce quartier ne semble pas être à Yaoundé. Nous ne livrons que dans Yaoundé.'
            : 'This neighborhood does not appear to be in Yaoundé. We only deliver in Yaoundé.',
        )
        set('customFee', undefined)
        set('customQuartierError', 'hors-zone')
        setGeocoding(false)
        return
      }

      const distance = haversineKm(
        TC_LAT,
        TC_LNG,
        parseFloat(yaoundeResult.lat),
        parseFloat(yaoundeResult.lon),
      )
      const fee = distance <= 5 ? 1000 : 2000
      const label = yaoundeResult.display_name.split(',')[0]
      const roundedDistance = Math.round(distance * 10) / 10

      setGeoResult({ distance: roundedDistance, fee, label })
      set('quartier', `${name} (${roundedDistance} km)`)
      set('customFee', fee)
      set('customQuartierError', undefined)
    } catch {
      setGeoError(
        isFr
          ? 'Impossible de vérifier ce quartier. Vérifiez votre connexion.'
          : 'Unable to verify this neighborhood. Check your connection.',
      )
    }
    setGeocoding(false)
  }

  const isOtherQuartier =
    data.quartier === 'Autre quartier' ||
    data.customFee != null ||
    !!data.customQuartierError ||
    (data.quartier !== '' &&
      !quartiers.includes(data.quartier as (typeof quartiers)[number]))

  useEffect(() => {
    if (!isOtherQuartier) return
    const timer = setTimeout(() => {
      if (customInput.trim().length >= 3) void geocodeQuartier(customInput)
    }, 800)
    return () => clearTimeout(timer)
  }, [customInput, isOtherQuartier])

  const getQuartierErrorMessage = () => {
    if (data.customQuartierError === 'hors-zone') return errorMessages.quartierHorsZone
    if (isOtherQuartier && !geoResult) return errorMessages.quartierCustom
    return errorMessages.quartier
  }

  const fieldErrorClass = (hasError: boolean) =>
    hasError ? 'border-red-500/40 focus:border-red-500/50' : ''

  const validate = () => {
    const required: (keyof DeliveryData)[] = ['nom', 'telephone', 'quartier', 'adresse', 'repere']
    if (data.horaire === 'schedule') required.push('heureChoisie')
    const errs: Partial<Record<keyof DeliveryData, boolean>> = {}
    required.forEach((k) => {
      const value = data[k]
      if (!value?.toString().trim()) errs[k] = true
    })
    if (isOtherQuartier && !geoResult) {
      errs.quartier = true
    }
    if (data.customQuartierError === 'hors-zone') {
      errs.quartier = true
    }
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      const fieldRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
        nom: nomRef,
        telephone: telephoneRef,
        quartier: quartierRef,
        adresse: adresseRef,
        repere: repereRef,
        heureChoisie: heureChoisieRef,
      }
      const scrollOrder = ['nom', 'telephone', 'quartier', 'adresse', 'repere', 'heureChoisie']
      const firstError = scrollOrder.find((f) => errs[f as keyof DeliveryData])
      if (firstError && fieldRefs[firstError]?.current) {
        fieldRefs[firstError].current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-6 px-6 py-5"
    >
      {/* En-tête section */}
      <div className="flex items-center gap-2 text-tc-gold/70">
        <MapPin size={14} />
        <span className="text-xs uppercase tracking-widest">
          {isFr ? 'Informations de livraison' : 'Delivery information'}
        </span>
      </div>

      {/* Nom + Téléphone */}
      <div className="grid grid-cols-1 gap-3">
        <div ref={nomRef}>
          <label className={cn(labelClass, errors.nom && 'text-red-400')}>
            <User size={10} className="mr-1 inline" />
            {isFr ? 'Nom complet' : 'Full name'} *
          </label>
          <input
            type="text"
            value={data.nom}
            onChange={(e) => { set('nom', e.target.value); setErrors((p) => ({ ...p, nom: false })) }}
            placeholder={isFr ? 'Votre nom' : 'Your name'}
            className={cn(inputClass, fieldErrorClass(!!errors.nom))}
          />
          {errors.nom && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={12} />
              {errorMessages.nom}
            </motion.p>
          )}
        </div>
        <div ref={telephoneRef}>
          <label className={cn(labelClass, errors.telephone && 'text-red-400')}>
            <Phone size={10} className="mr-1 inline" />
            {isFr ? 'Téléphone WhatsApp' : 'WhatsApp number'} *
          </label>
          <input
            type="tel"
            value={data.telephone}
            onChange={(e) => { set('telephone', e.target.value); setErrors((p) => ({ ...p, telephone: false })) }}
            placeholder="+237 6XX XXX XXX"
            className={cn(inputClass, fieldErrorClass(!!errors.telephone))}
          />
          {errors.telephone && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={12} />
              {errorMessages.telephone}
            </motion.p>
          )}
        </div>
      </div>

      {/* Adresse */}
      <div className="flex flex-col gap-3">
        <div ref={quartierRef}>
          <label className={cn(labelClass, errors.quartier && 'text-red-400')}>
            {isFr ? 'Quartier' : 'Neighborhood'} *
          </label>
          <div className="relative">
            <select
              value={
                data.quartier === 'Autre quartier' ||
                data.customFee != null ||
                data.customQuartierError ||
                (data.quartier !== '' &&
                  !quartiers.includes(data.quartier as (typeof quartiers)[number]))
                  ? 'Autre quartier'
                  : data.quartier
              }
              onChange={(e) => {
                const v = e.target.value
                setCustomInput('')
                setGeoResult(null)
                setGeoError(null)
                onChange({
                  ...data,
                  quartier: v,
                  customFee: undefined,
                  customQuartierError: undefined,
                })
                setErrors((p) => ({ ...p, quartier: false }))
              }}
              className={cn(inputClass, 'appearance-none pr-8', fieldErrorClass(!!errors.quartier))}
            >
              <option value="" style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
                {isFr ? '— Choisir votre quartier —' : '— Select your neighborhood —'}
              </option>
              {quartiers.map((q) => (
                <option key={q} value={q} style={{ backgroundColor: '#0A0A0A', color: '#F5F0EB' }}>
                  {q}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tc-cream/30"
            />
          </div>

          {(data.quartier === 'Autre quartier' ||
            data.customFee != null ||
            data.customQuartierError ||
            (data.quartier !== '' &&
              !quartiers.includes(data.quartier as (typeof quartiers)[number]))) && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value)
                  setGeoResult(null)
                  setGeoError(null)
                  if (data.quartier !== 'Autre quartier') {
                    onChange({
                      ...data,
                      quartier: 'Autre quartier',
                      customFee: undefined,
                      customQuartierError: undefined,
                    })
                  }
                }}
                placeholder={isFr ? 'Tapez votre quartier...' : 'Type your neighborhood...'}
                className={inputClass}
                autoFocus
              />

              {geocoding && (
                <p className="flex animate-pulse items-center gap-2 text-xs text-white/40">
                  <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-tc-gold/60" />
                  {isFr ? 'Localisation en cours...' : 'Locating...'}
                </p>
              )}

              {geoResult && !geocoding && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-xs font-medium text-emerald-400">
                    {isFr ? '✓ Quartier trouvé' : '✓ Neighborhood found'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/50">{geoResult.label}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-white/40">
                      {isFr ? 'Distance' : 'Distance'} : ~{geoResult.distance} km{' '}
                      {isFr ? 'du restaurant' : 'from restaurant'}
                    </p>
                    <p className="text-sm font-bold text-tc-gold">
                      {geoResult.fee.toLocaleString('fr-FR')} F
                    </p>
                  </div>
                  {geoResult.fee === 2000 && (
                    <p className="mt-1 text-[10px] text-amber-400/70">
                      {isFr
                        ? '⚠️ Quartier éloigné — frais majorés à 2 000 F'
                        : '⚠️ Remote area — delivery fee increased to 2,000 F'}
                    </p>
                  )}
                </div>
              )}

              {geoError && !geocoding && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-xs text-red-400">✗ {geoError}</p>
                </div>
              )}

              {customInput.length < 3 && !geoResult && !geocoding && (
                <p className="mt-2 text-[10px] text-white/25">
                  {isFr
                    ? 'Tapez au moins 3 caractères pour lancer la recherche'
                    : 'Type at least 3 characters to start search'}
                </p>
              )}
            </div>
          )}
          {errors.quartier && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={12} />
              {getQuartierErrorMessage()}
            </motion.p>
          )}
        </div>

        <div ref={adresseRef}>
          <label className={cn(labelClass, errors.adresse && 'text-red-400')}>
            {isFr ? 'Adresse précise' : 'Precise address'} *
          </label>
          <input
            type="text"
            value={data.adresse}
            onChange={(e) => { set('adresse', e.target.value); setErrors((p) => ({ ...p, adresse: false })) }}
            placeholder={isFr ? 'Rue, numéro, immeuble...' : 'Street, number, building...'}
            className={cn(inputClass, fieldErrorClass(!!errors.adresse))}
          />
          {errors.adresse && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={12} />
              {errorMessages.adresse}
            </motion.p>
          )}
        </div>

        <div ref={repereRef}>
          <label className={cn(labelClass, errors.repere && 'text-red-400')}>
            {isFr ? 'Point de repère' : 'Landmark'} *
          </label>
          <input
            type="text"
            value={data.repere}
            onChange={(e) => { set('repere', e.target.value); setErrors((p) => ({ ...p, repere: false })) }}
            placeholder={isFr ? 'Ex: En face de la pharmacie X, portail rouge' : 'E.g. Opposite pharmacy X, red gate'}
            className={cn(inputClass, fieldErrorClass(!!errors.repere))}
          />
          {errors.repere && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={12} />
              {errorMessages.repere}
            </motion.p>
          )}
          <p className="mt-1 flex items-center gap-1 text-[10px] text-tc-cream/25">
            <AlertCircle size={9} />
            {isFr ? 'Aide le livreur à vous trouver facilement' : 'Helps the driver find you easily'}
          </p>
        </div>

        <div>
          <label className={labelClass}>
            {isFr ? 'Étage / Appartement' : 'Floor / Apartment'}
            <span className="ml-1 opacity-40">{isFr ? '(optionnel)' : '(optional)'}</span>
          </label>
          <input
            type="text"
            value={data.etage}
            onChange={(e) => set('etage', e.target.value)}
            placeholder={isFr ? 'Ex: 3ème étage, appt 12' : 'E.g. 3rd floor, apt 12'}
            className={inputClass}
          />
        </div>
      </div>

      {/* Horaire */}
      <div>
        <label className={labelClass}>
          <Clock size={10} className="mr-1 inline" />
          {isFr ? 'Heure de livraison' : 'Delivery time'}
        </label>
        <div className="flex gap-2">
          {(['asap', 'schedule'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...data, horaire: v })}
              className={cn(
                'flex-1 py-2.5 text-xs uppercase tracking-wider transition-all',
                data.horaire === v
                  ? 'bg-tc-gold text-tc-black font-bold'
                  : 'border border-white/10 text-tc-cream/40 hover:border-white/25',
              )}
            >
              {v === 'asap'
                ? isFr ? 'Dès que possible' : 'ASAP'
                : isFr ? 'Choisir une heure' : 'Schedule'}
            </button>
          ))}
        </div>
        {data.horaire === 'schedule' && (
          <div ref={heureChoisieRef}>
            <motion.input
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              type="time"
              value={data.heureChoisie}
              onChange={(e) => { set('heureChoisie', e.target.value); setErrors((p) => ({ ...p, heureChoisie: false })) }}
              className={cn(inputClass, 'mt-2', fieldErrorClass(!!errors.heureChoisie))}
            />
            {errors.heureChoisie && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle size={12} />
                {errorMessages.heureChoisie}
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* Paiement */}
      <div>
        <label className={labelClass}>
          <CreditCard size={10} className="mr-1 inline" />
          {isFr ? 'Mode de paiement' : 'Payment method'}
        </label>
        <div className="flex flex-col gap-2">
          {paiementOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ ...data, paiement: opt.id })}
              className={cn(
                'flex items-center gap-3 border px-4 py-3 text-left transition-all',
                data.paiement === opt.id
                  ? 'border-tc-gold/50 bg-tc-gold/5'
                  : 'border-white/10 hover:border-white/20',
              )}
            >
              <div className="shrink-0">{opt.icon}</div>
              <div>
                <p className={cn('text-sm', data.paiement === opt.id ? 'text-tc-gold' : 'text-tc-cream')}>
                  {isFr ? opt.labelFr : opt.labelEn}
                </p>
                <p className="text-[11px] text-tc-cream/30">
                  {isFr ? opt.descFr : opt.descEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className={labelClass}>
          {isFr ? 'Instructions pour le livreur' : 'Instructions for driver'}
          <span className="ml-1 opacity-40">{isFr ? '(optionnel)' : '(optional)'}</span>
        </label>
        <textarea
          value={data.instructions}
          onChange={(e) => set('instructions', e.target.value)}
          rows={2}
          placeholder={isFr ? 'Ex: Appeler avant d\'arriver, code portail 1234...' : 'E.g. Call before arriving, gate code 1234...'}
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleNext}
          className="flex w-full items-center justify-center gap-2 bg-tc-gold py-3.5 text-sm font-bold uppercase tracking-widest text-tc-black transition-all hover:bg-tc-gold/90"
        >
          {isFr ? 'Vérifier ma commande →' : 'Review my order →'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="py-2 text-center text-xs text-tc-cream/30 transition-colors hover:text-tc-cream/60"
        >
          ← {isFr ? 'Retour au panier' : 'Back to cart'}
        </button>
      </div>
    </motion.div>
  )
}
