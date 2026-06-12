import { NextResponse } from 'next/server'
import { createAdminClient, getAdminClientConfigError } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const configError = getAdminClientConfigError()
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: configError ?? 'Configuration Supabase serveur incomplète' },
        { status: 500 },
      )
    }

    const body = (await request.json()) as {
      id?: string
      nom?: string
      telephone?: string
      photo_url?: string | null
      moto_immatriculation?: string
      moto_modele?: string | null
      pin?: string | null
      disponible?: boolean
      actif?: boolean
    }

    if (!body.nom?.trim() || !body.telephone?.trim() || !body.moto_immatriculation?.trim()) {
      return NextResponse.json(
        { error: 'nom, telephone et moto_immatriculation sont requis' },
        { status: 400 },
      )
    }

    if (!body.id && (!body.pin?.trim() || body.pin.trim().length !== 4)) {
      return NextResponse.json(
        { error: 'pin 4 chiffres requis à la création' },
        { status: 400 },
      )
    }

    const payload: Record<string, unknown> = {
      nom: body.nom.trim(),
      telephone: body.telephone.trim(),
      photo_url: body.photo_url ?? null,
      moto_immatriculation: body.moto_immatriculation.trim(),
      moto_modele: body.moto_modele?.trim() ?? null,
      disponible: body.disponible ?? true,
      actif: body.actif ?? true,
    }

    if (body.pin !== undefined) {
      const pin = body.pin?.trim() ?? ''
      payload.pin = pin.length > 0 ? pin : null
    }

    if (body.id) {
      const { data, error } = await admin
        .from('livreurs')
        .update(payload)
        .eq('id', body.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ livreur: data })
    }

    const newId = crypto.randomUUID()
    const { data, error } = await admin
      .from('livreurs')
      .insert({ id: newId, ...payload })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ livreur: data })
  } catch (err) {
    console.error('livreurs POST error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
