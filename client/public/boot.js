/*
 * Filet de sécurité au chargement : si le site ne s'est pas affiché (fichier principal bloqué par un réseau
 * lent ou coupé), la page se recharge d'elle-même une fois, puis propose un bouton « Recharger ».
 * Fichier séparé (pas de script dans la page) pour respecter la politique de sécurité du site.
 */
(function () {
  var KEY = 'bailio.boot'
  function waiting() {
    var b = document.getElementById('boot')
    return b && b.parentNode && b.parentNode.id === 'root'
  }
  window.setTimeout(function () {
    if (!waiting()) {
      try { sessionStorage.removeItem(KEY) } catch (e) {}
      return
    }
    var tried = false
    try { tried = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1') } catch (e) { tried = true }
    if (!tried) { window.location.reload(); return }
    var help = document.getElementById('boot-help')
    if (help) help.style.display = 'block'
  }, 8000)
  window.addEventListener('load', function () {
    window.setTimeout(function () { if (!waiting()) try { sessionStorage.removeItem(KEY) } catch (e) {} }, 1000)
  })
})()
