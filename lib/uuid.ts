/**
 * Génère un UUID v4 compatible avec tous les environnements
 *
 * Utilise crypto.randomUUID() si disponible (HTTPS ou localhost),
 * sinon utilise une implémentation de fallback pour HTTP
 */
export function generateUUID(): string {
  // Vérifier si crypto.randomUUID est disponible
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback pour HTTP (contextes non-sécurisés)
  // Implémentation basée sur RFC 4122
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
