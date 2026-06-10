'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type GalleryPhoto = { id: string; image_url: string; position: number }

// Cache module-level : évite de refetch si la galerie est déjà chargée
const galleryCache = new Map<string, GalleryPhoto[]>()

export function useGallery(galleryId: string, fallback: string[] = []) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => {
    // Utiliser le cache s'il existe, sinon les fallbacks statiques
    return (
      galleryCache.get(galleryId) ??
      fallback.map((url, i) => ({ id: `static-${i}`, image_url: url, position: i }))
    )
  })

  const fetch = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('gallery_photos')
      .select('id, image_url, position')
      .eq('gallery_id', galleryId)
      .order('position')
    if (data && data.length > 0) {
      galleryCache.set(galleryId, data)
      setPhotos(data)
    }
  }, [galleryId])

  useEffect(() => {
    void fetch()
  }, [fetch])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`gallery_${galleryId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_photos' },
        () => void fetch(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [galleryId, fetch])

  // useMemo évite de créer un nouveau tableau à chaque render du parent
  return useMemo(() => photos.map((p) => p.image_url), [photos])
}
