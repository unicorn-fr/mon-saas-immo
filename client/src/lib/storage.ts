// Stockage local tolérant : navigation privée ou stockage bloqué ne doivent rien casser.
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string | null): void {
    try {
      if (value === null) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, value)
    } catch {
      // ignoré
    }
  },
}

export const SESSION_KEY = 'bailio.session'
export const DRAFT_KEY = 'bailio.draft'
