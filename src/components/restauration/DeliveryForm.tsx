'use client'

import React from 'react'
import { useState } from 'react'
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

const quartiers = [
  'Bastos', 'Nlongkak', 'Lac Municipal', 'Tsinga', 'Ekoudou', 'Mvan',
  'Biyem-Assi', 'Essos', 'Omnisport', 'Santa Barbara', 'Ekié',
  'Mendong', 'Nkoldongo', 'Simbock', 'Mvog-Ada', 'Mfandena',
  'Ngousso', 'Nkol-Eton', 'Ahala', 'Autre quartier',
]

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
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
    <rect width="40" height="40" rx="6" fill="#FF6600"/>
    <text
      x="20"
      y="15"
      textAnchor="middle"
      fill="white"
      fontSize="8"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      ORANGE
    </text>
    <text
      x="20"
      y="26"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
    >
      MONEY
    </text>
  </svg>
)

const MTNMoMoIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
    <rect width="40" height="40" rx="6" fill="#FFCC00"/>
    <text
      x="20"
      y="16"
      textAnchor="middle"
      fill="#1a1a1a"
      fontSize="11"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
    >
      MTN
    </text>
    <text
      x="20"
      y="27"
      textAnchor="middle"
      fill="#1a1a1a"
      fontSize="8"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      MoMo
    </text>
  </svg>
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

interface Props {
  locale: string
  data: DeliveryData
  onChange: (data: DeliveryData) => void
  onNext: () => void
  onBack: () => void
}

export default function DeliveryForm({ locale, data, onChange, onNext, onBack }: Props) {
  const isFr = locale === 'fr'
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryData, boolean>>>({})

  const set = (key: keyof DeliveryData, value: string) =>
    onChange({ ...data, [key]: value })

  const validate = () => {
    const required: (keyof DeliveryData)[] = ['nom', 'telephone', 'quartier', 'adresse', 'repere']
    if (data.horaire === 'schedule') required.push('heureChoisie')
    const errs: Partial<Record<keyof DeliveryData, boolean>> = {}
    required.forEach((k) => { if (!data[k]) errs[k] = true })
    setErrors(errs)
    return Object.keys(errs).length === 0
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
        <div>
          <label className={cn(labelClass, errors.nom && 'text-red-400')}>
            <User size={10} className="mr-1 inline" />
            {isFr ? 'Nom complet' : 'Full name'} *
          </label>
          <input
            type="text"
            value={data.nom}
            onChange={(e) => { set('nom', e.target.value); setErrors((p) => ({ ...p, nom: false })) }}
            placeholder={isFr ? 'Votre nom' : 'Your name'}
            className={cn(inputClass, errors.nom && 'border-red-500/50')}
          />
        </div>
        <div>
          <label className={cn(labelClass, errors.telephone && 'text-red-400')}>
            <Phone size={10} className="mr-1 inline" />
            {isFr ? 'Téléphone WhatsApp' : 'WhatsApp number'} *
          </label>
          <input
            type="tel"
            value={data.telephone}
            onChange={(e) => { set('telephone', e.target.value); setErrors((p) => ({ ...p, telephone: false })) }}
            placeholder="+237 6XX XXX XXX"
            className={cn(inputClass, errors.telephone && 'border-red-500/50')}
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="flex flex-col gap-3">
        <div>
          <label className={cn(labelClass, errors.quartier && 'text-red-400')}>
            {isFr ? 'Quartier' : 'Neighborhood'} *
          </label>
          <div className="relative">
            <select
              value={data.quartier}
              onChange={(e) => { set('quartier', e.target.value); setErrors((p) => ({ ...p, quartier: false })) }}
              className={cn(inputClass, 'appearance-none pr-8', errors.quartier && 'border-red-500/50')}
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
        </div>

        <div>
          <label className={cn(labelClass, errors.adresse && 'text-red-400')}>
            {isFr ? 'Adresse précise' : 'Precise address'} *
          </label>
          <input
            type="text"
            value={data.adresse}
            onChange={(e) => { set('adresse', e.target.value); setErrors((p) => ({ ...p, adresse: false })) }}
            placeholder={isFr ? 'Rue, numéro, immeuble...' : 'Street, number, building...'}
            className={cn(inputClass, errors.adresse && 'border-red-500/50')}
          />
        </div>

        <div>
          <label className={cn(labelClass, errors.repere && 'text-red-400')}>
            {isFr ? 'Point de repère' : 'Landmark'} *
          </label>
          <input
            type="text"
            value={data.repere}
            onChange={(e) => { set('repere', e.target.value); setErrors((p) => ({ ...p, repere: false })) }}
            placeholder={isFr ? 'Ex: En face de la pharmacie X, portail rouge' : 'E.g. Opposite pharmacy X, red gate'}
            className={cn(inputClass, errors.repere && 'border-red-500/50')}
          />
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
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            type="time"
            value={data.heureChoisie}
            onChange={(e) => { set('heureChoisie', e.target.value); setErrors((p) => ({ ...p, heureChoisie: false })) }}
            className={cn(inputClass, 'mt-2', errors.heureChoisie && 'border-red-500/50')}
          />
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
