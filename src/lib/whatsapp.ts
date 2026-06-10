const WHATSAPP_PHONE = '237655867084'

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

/** Ouvre WhatsApp directement sur mobile, wa.me sur desktop. */
export function openWhatsApp(message: string, phone = WHATSAPP_PHONE) {
  const encoded = encodeURIComponent(message)
  const normalizedPhone = phone.replace(/\D/g, '')

  if (isMobileDevice()) {
    window.location.href = `whatsapp://send?phone=${normalizedPhone}&text=${encoded}`
    return
  }

  window.open(
    `https://wa.me/${normalizedPhone}?text=${encoded}`,
    '_blank',
    'noopener,noreferrer',
  )
}
