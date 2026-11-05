/**
 * Copies text to the clipboard. navigator.clipboard only exists in a secure
 * context: on a phone reaching the dev server over the LAN (plain HTTP), the
 * old execCommand path takes over.
 */
export async function copyText(text: string) {
  if (typeof navigator !== 'undefined' && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Falls through to the legacy path.
    }
  }
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  } finally {
    field.remove()
  }
}
