'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@/lib/supabase/client'
import 'leaflet/dist/leaflet.css'

const motoIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#00E5FF;
    border:2px solid #fff;
    border-radius:50%;
    width:36px;height:36px;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    box-shadow:0 0 12px rgba(0,229,255,0.6);
  ">🛵</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

type DeliveryMapProps = {
  lat: number
  lng: number
  livreurNom: string
  immatriculation: string
  deliveryId: string
  onPositionUpdate?: (lat: number, lng: number) => void
}

function MapTracker({
  lat,
  lng,
  livreurNom,
  immatriculation,
  deliveryId,
  onPositionUpdate,
}: DeliveryMapProps) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const initialPos = useRef({ lat, lng })
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const marker = L.marker(
      [initialPos.current.lat, initialPos.current.lng],
      { icon: motoIcon },
    )
      .addTo(map)
      .bindPopup(`${livreurNom} · ${immatriculation}`)
    markerRef.current = marker

    const circle = L.circle(
      [initialPos.current.lat, initialPos.current.lng],
      {
      radius: 30,
      color: '#00E5FF',
      fillColor: '#00E5FF',
      fillOpacity: 0.1,
      weight: 1,
      },
    ).addTo(map)
    circleRef.current = circle

    map.setView(
      [initialPos.current.lat, initialPos.current.lng],
      15,
    )

    return () => {
      marker.remove()
      circle.remove()
      markerRef.current = null
      circleRef.current = null
    }
  }, [map, livreurNom, immatriculation])

  useEffect(() => {
    if (!markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    circleRef.current?.setLatLng([lat, lng])
    map.panTo([lat, lng], { animate: true, duration: 0.8 })
  }, [lat, lng, map])

  useEffect(() => {
    const channel = supabase
      .channel(`pos-${deliveryId}`)
      .on('broadcast', { event: 'position' }, ({ payload }) => {
        const { lat: bLat, lng: bLng } = payload as {
          lat: number
          lng: number
        }
        markerRef.current?.setLatLng([bLat, bLng])
        circleRef.current?.setLatLng([bLat, bLng])
        map.panTo([bLat, bLng], { animate: true, duration: 0.8 })
        onPositionUpdate?.(bLat, bLng)
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [deliveryId, map, onPositionUpdate, supabase])

  return null
}

export default function DeliveryMap({
  lat,
  lng,
  livreurNom,
  immatriculation,
  deliveryId,
  onPositionUpdate,
}: DeliveryMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MapTracker
        lat={lat}
        lng={lng}
        livreurNom={livreurNom}
        immatriculation={immatriculation}
        deliveryId={deliveryId}
        onPositionUpdate={onPositionUpdate}
      />
    </MapContainer>
  )
}
