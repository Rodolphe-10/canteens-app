import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildStaffAssignUrl } from '@/lib/admin-links'

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://canteens-app.vercel.app'
const DEFAULT_LOCALE = 'fr'

async function notifyRestaurantViaCallMeBot(message: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY
  const phone = process.env.RESTAURANT_NOTIFY_PHONE?.replace(/\D/g, '')

  if (!apiKey || !phone) return false

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', phone)
  url.searchParams.set('text', message)
  url.searchParams.set('apikey', apiKey)

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' })
  return res.ok
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string }
    const orderId = body.orderId?.trim()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, client_nom, assign_token')
      .eq('id', orderId)
      .single()

    if (error || !order?.assign_token) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const staffLink = buildStaffAssignUrl(SITE_ORIGIN, DEFAULT_LOCALE, order.assign_token)
    const label = order.order_number ?? order.id.slice(0, 8).toUpperCase()
    const staffMessage =
      `🆕 Nouvelle commande ${label}\n` +
      `👤 ${order.client_nom}\n\n` +
      `🔗 Assigner un livreur (staff uniquement) :\n${staffLink}`

    const notified = await notifyRestaurantViaCallMeBot(staffMessage)

    return NextResponse.json({ ok: true, notified, staffLink })
  } catch (err) {
    console.error('staff-notify error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
