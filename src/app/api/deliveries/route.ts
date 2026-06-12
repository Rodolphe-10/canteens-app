import { NextResponse } from 'next/server'
import { createAdminClient, getAdminClientConfigError } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const configError = getAdminClientConfigError()
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: configError ?? 'Configuration Supabase serveur incomplète' },
        { status: 500 },
      )
    }

    const { data, error } = await admin
      .from('deliveries')
      .select('*, livreurs(nom, telephone, moto_immatriculation, photo_url)')
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('deliveries GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ deliveries: data ?? [] })
  } catch (err) {
    console.error('deliveries GET error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
      statut?: 'assignee' | 'en_route' | 'livree' | 'annulee'
    }

    if (!body.id || !body.statut) {
      return NextResponse.json({ error: 'id et statut requis' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { statut: body.statut }
    if (body.statut === 'en_route') {
      updates.started_at = new Date().toISOString()
    }
    if (body.statut === 'livree') {
      updates.delivered_at = new Date().toISOString()
    }

    const { data, error } = await admin
      .from('deliveries')
      .update(updates)
      .eq('id', body.id)
      .select('*, livreurs(nom, telephone, moto_immatriculation, photo_url)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ delivery: data })
  } catch (err) {
    console.error('deliveries PATCH error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
