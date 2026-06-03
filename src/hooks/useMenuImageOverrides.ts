'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ImageOverrideMap = Record<string, string>

export function useMenuImageOverrides(): ImageOverrideMap {
  const [overrides, setOverrides] = useState<ImageOverrideMap>({})

  useEffect(() => {
    const supabase = createClient()

    const load = () =>
      supabase.from('menu_images').select('item_id, image_url').then(({ data }) => {
        if (!data) return
        const map: ImageOverrideMap = {}
        data.forEach((r) => { map[r.item_id] = r.image_url })
        setOverrides(map)
      })

    load()

    const channel = supabase
      .channel('menu_images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_images' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return overrides
}
