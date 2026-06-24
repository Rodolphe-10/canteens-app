import { NextResponse } from 'next/server'
import { createAdminClient, getAdminClientConfigError } from '@/lib/supabase/admin'

type LivreurRow = {
  id: string
  nom: string
  telephone: string
  photo_url: string | null
  moto_immatriculation: string
  moto_modele: string | null
  pin: string | null
  actif: boolean
}

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
      telephone?: string
      pin?: string
    }

    const telephone = body.telephone?.trim()
    const pin = body.pin?.trim()

    if (!telephone || !pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'Téléphone ou PIN incorrect' },
        { status: 400 },
      )
    }

    const { data, error } = await admin
      .from('livreurs')
      .select(
        'id, nom, telephone, photo_url, moto_immatriculation, moto_modele, pin, actif',
      )
      .eq('telephone', telephone)
      .eq('actif', true)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const livreur = (data?.[0] as LivreurRow | undefined) ?? null

    if (!livreur) {
      return NextResponse.json(
        { error: 'Téléphone ou PIN incorrect' },
        { status: 401 },
      )
    }

    if (!livreur.pin) {
      return NextResponse.json(
        { error: 'Demandez votre PIN à l\'administrateur' },
        { status: 403 },
      )
    }

    if (livreur.pin !== pin) {
      return NextResponse.json(
        { error: 'Téléphone ou PIN incorrect' },
        { status: 401 },
      )
    }

    // Ne jamais renvoyer le PIN au client
    return NextResponse.json({
      livreur: {
        id: livreur.id,
        nom: livreur.nom,
        telephone: livreur.telephone,
        photo_url: livreur.photo_url ?? undefined,
        moto_immatriculation: livreur.moto_immatriculation,
        moto_modele: livreur.moto_modele ?? undefined,
      },
    })
  } catch (err) {
    console.error('livreur login error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
