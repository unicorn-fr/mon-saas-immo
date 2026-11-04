/** Moment du dernier changement de page : distingue un message affiché à l'ouverture d'un message dû à une action. */
let lastNavigation = typeof performance !== 'undefined' ? performance.now() : 0
export function markNavigation() {
  lastNavigation = performance.now()
}
/** Vrai si la page est ouverte depuis assez longtemps pour qu'un nouveau message vienne d'une action de la personne. */
export const afterAction = () => typeof performance !== 'undefined' && performance.now() - lastNavigation > 1200
