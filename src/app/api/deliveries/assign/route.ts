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
      orderId?: string
      livreurId?: string
      etaMinutes?: number
      clientNom?: string
      clientTelephone?: string
      clientAdresse?: string
    }

    const orderId = body.orderId?.trim()
    const livreurId = body.livreurId?.trim()

    if (!orderId || !livreurId) {
      return NextResponse.json(
        { error: 'orderId et livreurId sont requis' },
        { status: 400 },
      )
    }

    const { data: livreur, error: livreurError } = await admin
      .from('livreurs')
      .select('id, nom, telephone')
      .eq('id', livreurId)
      .eq('actif', true)
      .maybeSingle()

    if (livreurError || !livreur) {
      return NextResponse.json(
        {
          error:
            'Livreur introuvable. Ajoutez-le dans l\'onglet « Livreurs » du Dashboard.',
        },
        { status: 404 },
      )
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 },
      )
    }

    const etaMinutes = Math.min(120, Math.max(5, body.etaMinutes ?? 25))

    const { data: delivery, error: deliveryError } = await admin
      .from('deliveries')
      .insert({
        order_id: orderId,
        livreur_id: livreur.id,
        client_nom: body.clientNom ?? null,
        client_telephone: body.clientTelephone ?? null,
        client_adresse: body.clientAdresse ?? null,
        statut: 'assignee',
        eta_minutes: etaMinutes,
      })
      .select()
      .single()

    if (deliveryError) {
      console.error('delivery insert error:', deliveryError)
      return NextResponse.json({ error: deliveryError.message }, { status: 400 })
    }

    await admin.from('orders').update({ statut: 'en_livraison' }).eq('id', orderId)

    return NextResponse.json({ delivery, livreur })
  } catch (err) {
    console.error('deliveries assign error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
