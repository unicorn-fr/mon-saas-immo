// Inventaire d'un écran : titres, champs (avec intitulé), boutons, liens.
export async function snap(page) {
  return page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const name = (e) => (e.getAttribute('aria-label') || (e.labels && e.labels[0]?.innerText) || e.getAttribute('placeholder') || e.innerText || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 80)
    const out = []
    document.querySelectorAll('h1,h2,h3,legend,input,select,textarea,button,a[href],[role=radio],[role=checkbox]').forEach((e) => {
      if (!vis(e)) return
      const t = e.tagName.toLowerCase()
      const extra = t === 'input' ? `[${e.type}]` : t === 'a' ? `→${e.getAttribute('href')}` : ''
      out.push(`${t}${extra} ${name(e)}`)
    })
    document.querySelectorAll('[role=alert],[role=status],[aria-live]').forEach((e) => { const t = e.innerText?.trim(); if (t) out.push(`ALERTE ${t.replace(/\s+/g, ' ').slice(0, 200)}`) })
    document.querySelectorAll('[aria-invalid=true]').forEach((e) => out.push(`INVALIDE ${name(e)}`))
    return out.join('\n')
  })
}
