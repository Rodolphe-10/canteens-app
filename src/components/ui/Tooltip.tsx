'use client'

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

function useCanHover() {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return canHover
}

export default function Tooltip({
  text,
  children,
  position = 'top',
  delay = 300,
  wrapperClassName,
}: {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  wrapperClassName?: string
}) {
  const canHover = useCanHover()
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== 'mouse') return
    timer.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== 'mouse') return
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  if (!canHover) {
    return (
      <span className={wrapperClassName ?? 'inline-flex'}>{children}</span>
    )
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className={wrapperClassName ?? 'relative inline-flex'}
      onPointerEnter={show}
      onPointerLeave={hide}
    >
      {children}
      {visible && (
        <span
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-white/10 bg-[#111] px-2.5 py-1 text-[11px] text-white/80 shadow-lg backdrop-blur-sm',
            positionClasses[position],
          )}
        >
          {text}
        </span>
      )}
    </span>
  )
}
