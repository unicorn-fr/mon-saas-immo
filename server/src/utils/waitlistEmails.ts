import crypto from 'crypto'

/**
 * Email 1 — Confirmation d'inscription
 * Envoyé immédiatement après l'inscription en waitlist.
 */
export function buildWaitlistConfirmationEmail(
  email: string,
  position: number,
  isEarlyAccess: boolean,
  launchDate: Date,
): { subject: string; html: string } {
  const launchDateFr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(launchDate)

  const subject = 'Vous êtes sur la liste. Voici ce qui vous attend.'

  const earlyAccessBlock = isEarlyAccess
    ? `
    <div style="background:#fdf5ec;border:1px solid #f3c99a;border-radius:10px;padding:20px 24px;margin:24px 0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#c4976a;flex-shrink:0;"></div>
        <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#92400e;">Accès anticipé garanti</p>
      </div>
      <p style="margin:0;font-size:14px;color:#5a5754;line-height:1.6;">
        Vous faites partie des <strong style="color:#0d0c0a;">150 premiers</strong> — vous recevrez <strong style="color:#0d0c0a;">2 mois de plan Pro offerts</strong> dès le lancement. Aucune action requise de votre part.
      </p>
    </div>`
    : ''

  const positionBlock = `
    <div style="background:#f4f2ee;border-radius:10px;padding:20px;text-align:center;margin:24px 0;border:1px solid #e4e1db;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9e9b96;">Votre position</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:42px;font-weight:700;font-style:italic;color:#0d0c0a;line-height:1;">#${position}</p>
      ${isEarlyAccess ? '<p style="margin:6px 0 0;font-size:12px;color:#c4976a;font-weight:600;">Accès anticipé inclus</p>' : ''}
    </div>`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bailio — Vous êtes sur la liste</title>
</head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border:1px solid #e4e1db;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(13,12,10,0.04),0 4px 12px rgba(13,12,10,0.06);">

      <!-- Header -->
      <div style="background:#1a1a2e;padding:28px 40px;display:flex;align-items:center;gap:10px;">
        <div style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.1);display:inline-flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </div>
        <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.01em;font-family:Georgia,serif;font-style:italic;">Bailio</span>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9e9b96;">Liste d'attente</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:28px;font-weight:700;font-style:italic;color:#0d0c0a;line-height:1.2;">
          Votre place est réservée.
        </h1>

        <p style="margin:0 0 16px;font-size:15px;color:#5a5754;line-height:1.7;">
          Bonjour,
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#5a5754;line-height:1.7;">
          Vous êtes officiellement sur la liste d'attente Bailio.
        </p>

        ${earlyAccessBlock}
        ${positionBlock}

        <p style="margin:0 0 8px;font-size:14px;color:#5a5754;line-height:1.7;">
          Bailio, c'est la plateforme que les propriétaires et locataires méritaient d'avoir. Sans agence. Sans intermédiaire. Avec les bons outils.
        </p>

        <!-- Features list -->
        <div style="margin:28px 0;border-top:1px solid #e4e1db;padding-top:24px;">
          <p style="margin:0 0 14px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#9e9b96;">Ce qui vous attend au lancement</p>
          ${[
            ['Vérification IA des dossiers locatifs', 'Analyse automatique des pièces justificatives en quelques secondes.'],
            ['Signature électronique légale (eIDAS)', 'Bail, état des lieux — signés en ligne, valeur juridique garantie.'],
            ['Gestion complète du bail', 'Depuis une seule interface — quittances, paiements, historique.'],
            ['Messagerie sécurisée', 'Canal dédié propriétaire ↔ locataire, traçable et archivé.'],
          ]
            .map(
              ([title, desc]) => `
          <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start;">
            <div style="width:6px;height:6px;border-radius:50%;background:#c4976a;margin-top:7px;flex-shrink:0;"></div>
            <div>
              <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0d0c0a;">${title}</p>
              <p style="margin:0;font-size:12px;color:#9e9b96;line-height:1.5;">${desc}</p>
            </div>
          </div>`,
            )
            .join('')}
        </div>

        <div style="background:#f4f2ee;border-radius:8px;padding:14px 18px;margin:24px 0;display:flex;align-items:center;gap:12px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e9b96" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <p style="margin:0;font-size:13px;color:#5a5754;">
            Lancement estimé : <strong style="color:#0d0c0a;">${launchDateFr}</strong>
          </p>
        </div>

        <p style="margin:0;font-size:14px;color:#5a5754;line-height:1.7;">
          On vous prévient dès que c'est là.
        </p>
        <p style="margin:20px 0 0;font-size:14px;color:#5a5754;line-height:1.7;">
          L'équipe Bailio<br/>
          <a href="https://bailio.fr" style="color:#c4976a;text-decoration:none;font-weight:500;">bailio.fr</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 40px;background:#f4f2ee;border-top:1px solid #e4e1db;">
        <p style="margin:0;font-size:11px;color:#9e9b96;line-height:1.6;">
          Vous recevez cet email car vous vous êtes inscrit sur la liste d'attente Bailio avec l'adresse <strong>${email}</strong>.
          Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`

  return { subject, html }
}

/**
 * Email 2 — Email de lancement (envoyé le jour J à tous les inscrits)
 */
export function buildWaitlistLaunchEmail(
  email: string,
  isEarlyAccess: boolean,
  frontendUrl: string,
): { subject: string; html: string } {
  const subject = 'Bailio est en ligne. Votre accès vous attend.'

  // 6-char promo code derived from email hash
  const promoCode = `EARLY-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 6).toUpperCase()}`
  const signupUrl = `${frontendUrl}/register`

  const earlyAccessBlock = isEarlyAccess
    ? `
    <div style="background:#fdf5ec;border:1px solid #f3c99a;border-radius:10px;padding:20px 24px;margin:24px 0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#c4976a;flex-shrink:0;"></div>
        <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#92400e;">Avantage Early Access</p>
      </div>
      <p style="margin:0 0 14px;font-size:14px;color:#5a5754;line-height:1.6;">
        Comme l'un des <strong style="color:#0d0c0a;">150 premiers inscrits</strong>, vous bénéficiez de <strong style="color:#0d0c0a;">2 mois offerts sur le plan Pro</strong>. Utilisez ce code lors de votre inscription :
      </p>
      <div style="background:#ffffff;border:1px solid #e4e1db;border-radius:8px;padding:14px;text-align:center;">
        <p style="margin:0 0 4px;font-size:10px;color:#9e9b96;letter-spacing:0.08em;text-transform:uppercase;">Votre code promo</p>
        <p style="margin:0;font-family:monospace;font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:0.12em;">${promoCode}</p>
      </div>
    </div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bailio est en ligne</title>
</head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border:1px solid #e4e1db;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(13,12,10,0.04),0 4px 12px rgba(13,12,10,0.06);">

      <!-- Header -->
      <div style="background:#1a1a2e;padding:28px 40px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.1);display:inline-flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fafaf8" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.01em;font-family:Georgia,serif;font-style:italic;">Bailio</span>
        </div>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:700;font-style:italic;color:#ffffff;line-height:1.2;">
          Le moment est arrivé.
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.6);">Bailio est officiellement en ligne.</p>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="margin:0 0 16px;font-size:15px;color:#5a5754;line-height:1.7;">
          Bonjour,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#5a5754;line-height:1.7;">
          La plateforme que vous attendiez est maintenant accessible. Gérez vos locations en direct, sans agence, sans commission.
        </p>

        ${earlyAccessBlock}

        <!-- CTA -->
        <div style="text-align:center;margin:32px 0;">
          <a href="${signupUrl}" style="display:inline-block;padding:16px 40px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.01em;font-family:'DM Sans',Arial,sans-serif;">
            Créer mon compte
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#9e9b96;">
            ou copiez ce lien : <a href="${signupUrl}" style="color:#c4976a;text-decoration:none;">${signupUrl}</a>
          </p>
        </div>

        <hr style="border:none;border-top:1px solid #e4e1db;margin:28px 0;" />

        <p style="margin:0;font-size:14px;color:#5a5754;line-height:1.7;">
          Bienvenue dans la location réinventée.
        </p>
        <p style="margin:16px 0 0;font-size:14px;color:#5a5754;line-height:1.7;">
          L'équipe Bailio<br/>
          <a href="https://bailio.fr" style="color:#c4976a;text-decoration:none;font-weight:500;">bailio.fr</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 40px;background:#f4f2ee;border-top:1px solid #e4e1db;">
        <p style="margin:0;font-size:11px;color:#9e9b96;line-height:1.6;">
          Vous recevez cet email car vous vous êtes inscrit sur la liste d'attente Bailio avec l'adresse <strong>${email}</strong>.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`

  return { subject, html }
}
