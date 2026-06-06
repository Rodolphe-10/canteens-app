'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(target)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  useEffect(() => {
    if (!isInView) return
    const duration = 1500
    const steps = 40
    const increment = target / steps
    let current = 0
    setCount(0)
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  const display = isInView ? count : target

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

export default function StatsSection({ locale }: { locale: string }) {
  const stats = [
    {
      value: 80,
      suffix: '+',
      labelFr: 'couverts',
      labelEn: 'seats',
      icon: '🪑',
    },
    {
      value: 40,
      suffix: '+',
      labelFr: 'plats au menu',
      labelEn: 'menu dishes',
      icon: '🍽️',
    },
    {
      value: 10,
      suffix: '',
      labelFr: 'jeux disponibles',
      labelEn: 'games available',
      icon: '🎮',
    },
    {
      textFr: '2H30 / 4H',
      textEn: '2:30 / 4 AM',
      labelFr: 'lun–jeu & dim · ven–sam',
      labelEn: 'Mon–Thu & Sun · Fri–Sat',
      icon: '🌙',
    },
  ]

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section ref={ref} className="border-y border-white/5 bg-tc-black px-4 py-20">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.labelFr}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="mb-3 text-3xl">{stat.icon}</div>
            <div className="mb-2 font-serif text-3xl font-bold text-gradient-gold sm:text-4xl">
              {'textFr' in stat
                ? (locale === 'fr' ? stat.textFr : stat.textEn)
                : <AnimatedNumber target={stat.value} suffix={stat.suffix} />}
            </div>
            <p className="text-xs uppercase tracking-widest text-tc-cream/40">
              {locale === 'fr' ? stat.labelFr : stat.labelEn}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
