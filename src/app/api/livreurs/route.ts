import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY manquante sur le serveur' },
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
      disponible?: boolean
      actif?: boolean
    }

    if (!body.nom?.trim() || !body.telephone?.trim() || !body.moto_immatriculation?.trim()) {
      return NextResponse.json(
        { error: 'nom, telephone et moto_immatriculation sont requis' },
        { status: 400 },
      )
    }

    const payload = {
      nom: body.nom.trim(),
      telephone: body.telephone.trim(),
      photo_url: body.photo_url ?? null,
      moto_immatriculation: body.moto_immatriculation.trim(),
      moto_modele: body.moto_modele?.trim() ?? null,
      disponible: body.disponible ?? true,
      actif: body.actif ?? true,
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
