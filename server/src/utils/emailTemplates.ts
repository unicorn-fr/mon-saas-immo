/**
 * Email templates — Bailio
 * Design cohérent avec le DA "Maison" (Cormorant Garamond + DM Sans, #1a1a2e, #c4976a)
 */

const BASE = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bailio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fafaf8; font-family: 'DM Sans', Arial, sans-serif; color: #0d0c0a; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e4e1db; border-radius: 16px; overflow: hidden; }
    .header { background: #1a1a2e; padding: 32px 40px; text-align: center; }
    .header-logo { color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
    .header-logo span { color: #c4976a; }
    .body { padding: 40px; }
    .overline { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #9e9b96; margin-bottom: 12px; }
    .title { font-size: 26px; font-weight: 700; color: #0d0c0a; margin-bottom: 16px; line-height: 1.25; }
    .text { font-size: 14px; color: #5a5754; line-height: 1.7; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 32px; background: #1a1a2e; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 24px 0; }
    .code-block { background: #f4f2ee; border: 1px solid #e4e1db; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 0.15em; color: #1a1a2e; font-family: monospace; }
    .divider { border: none; border-top: 1px solid #e4e1db; margin: 24px 0; }
    .footer { padding: 24px 40px; background: #f4f2ee; text-align: center; font-size: 12px; color: #9e9b96; line-height: 1.6; }
    .link { color: #c4976a; text-decoration: underline; word-break: break-all; font-size: 12px; }
    .warning { background: #fdf5ec; border: 1px solid #f3c99a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Bai<span>lio</span></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Bailio — Plateforme de gestion locative</p>
      <p style="margin-top:6px;">Vous recevez cet email car vous avez un compte sur notre plateforme.</p>
    </div>
  </div>
</body>
</html>
`

export const emailVerificationTemplate = (params: {
  firstName: string
  code: string
}) => ({
  subject: 'Votre code de vérification — Bailio',
  html: BASE(`
    <div class="overline">Vérification du compte</div>
    <div class="title">Bonjour ${params.firstName},<br>voici votre code</div>
    <p class="text">
      Merci de vous être inscrit sur Bailio. Entrez ce code sur le site pour activer votre compte.
    </p>
    <div class="code-block">
      <div class="code">${params.code}</div>
    </div>
    <div class="warning">
      Ce code expire dans <strong>15 minutes</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
    </div>
  `),
})

export const passwordResetTemplate = (params: {
  firstName: string
  code: string
}) => ({
  subject: 'Votre code de réinitialisation — Bailio',
  html: BASE(`
    <div class="overline">Sécurité du compte</div>
    <div class="title">Code de réinitialisation</div>
    <p class="text">
      Bonjour <strong>${params.firstName}</strong>, voici votre code à usage unique pour réinitialiser votre mot de passe.
    </p>
    <div class="code-block">
      <div class="code">${params.code}</div>
    </div>
    <p class="text" style="text-align:center;font-size:13px;">
      Rendez-vous sur <a href="${process.env.FRONTEND_URL ?? ''}/forgot-password" class="link">bailio.fr/forgot-password</a> et saisissez ce code.
    </p>
    <div class="warning">
      Ce code expire dans <strong>15 minutes</strong> et ne peut être utilisé qu'une seule fois. Si vous n'avez pas fait cette demande, ignorez cet email.
    </div>
  `),
})

export const phoneOtpTemplate = (params: {
  firstName: string
  code: string
}) => ({
  subject: 'Votre code de vérification — Bailio',
  html: BASE(`
    <div class="overline">Vérification du téléphone</div>
    <div class="title">Votre code de vérification</div>
    <p class="text">
      Bonjour <strong>${params.firstName}</strong>, voici votre code à 6 chiffres pour vérifier votre numéro de téléphone.
    </p>
    <div class="code-block">
      <div class="code">${params.code}</div>
    </div>
    <div class="warning">
      Ce code expire dans <strong>10 minutes</strong>. Ne le partagez jamais avec quelqu'un d'autre.
    </div>
  `),
})

export const welcomeTemplate = (params: { firstName: string; loginUrl: string }) => ({
  subject: 'Bienvenue sur Bailio !',
  html: BASE(`
    <div class="overline">Compte activé</div>
    <div class="title">Bienvenue, ${params.firstName} !</div>
    <p class="text">
      Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.
    </p>
    <div style="text-align:center;">
      <a href="${params.loginUrl}" class="btn">Accéder à mon espace</a>
    </div>
  `),
})

export const magicLinkTemplate = (params: { magicUrl: string; expiresMinutes?: number }) => ({
  subject: 'Votre lien de connexion — Bailio',
  html: BASE(`
    <div class="overline">Connexion sécurisée</div>
    <div class="title">Votre lien de connexion</div>
    <p class="text">
      Cliquez sur le bouton ci-dessous pour vous connecter instantanément à votre espace Bailio. Aucun mot de passe requis.
    </p>
    <div style="text-align:center;">
      <a href="${params.magicUrl}" class="btn">Se connecter maintenant</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:12px;">
      Ou copiez ce lien dans votre navigateur :<br/>
      <a href="${params.magicUrl}" class="link">${params.magicUrl}</a>
    </p>
    <div class="warning">
      Ce lien expire dans <strong>${params.expiresMinutes ?? 15} minutes</strong> et ne peut être utilisé qu'<strong>une seule fois</strong>.<br/>
      Si vous n'avez pas demandé ce lien, ignorez cet email.
    </div>
  `),
})

export const newsletterConfirmTemplate = (params: { email: string }) => ({
  subject: 'Votre alerte est activée — Bailio',
  html: BASE(`
    <div class="overline">Alertes biens</div>
    <div class="title">Vous serez le premier informé</div>
    <p class="text">
      Bonne nouvelle — votre adresse <strong>${params.email}</strong> est bien enregistrée.
      Dès qu'un bien correspondant à votre recherche est publié sur Bailio, vous recevrez un email en avant-première.
    </p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL ?? ''}/search" class="btn" style="background:#c4976a;">Parcourir les annonces</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:12px;text-align:center;color:#9e9b96;">
      Pour gérer vos alertes, créez un compte gratuit.
    </p>
  `),
})

export const onboardingOwnerJ1Template = (params: { firstName: string; loginUrl: string }) => ({
  subject: 'Publiez votre premier bien en 5 minutes — Bailio',
  html: BASE(`
    <div class="overline">Pour les propriétaires</div>
    <div class="title">Bonjour ${params.firstName}, prêt à publier ?</div>
    <p class="text">
      Votre compte est actif. Il ne vous reste plus qu'une étape : publier votre premier bien.
      0&nbsp;€ de frais d'agence, des candidatures qualifiées directement dans votre espace.
    </p>
    <div style="text-align:center;">
      <a href="${params.loginUrl}" class="btn">Publier mon bien maintenant</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:13px;color:#5a5754;">Ce que vous obtenez avec Bailio :</p>
    <p class="text" style="font-size:13px;line-height:2;">
      ✓ Bail conforme loi ALUR signé en ligne<br/>
      ✓ Candidats avec dossiers vérifiés par IA<br/>
      ✓ Quittances générées automatiquement
    </p>
  `),
})

export const onboardingTenantJ1Template = (params: { firstName: string; loginUrl: string }) => ({
  subject: 'Complétez votre dossier locatif — Bailio',
  html: BASE(`
    <div class="overline">Pour les locataires</div>
    <div class="title">Bonjour ${params.firstName}, constituez votre dossier</div>
    <p class="text">
      Un dossier complet augmente considérablement vos chances d'être accepté.
      Notre IA analyse et valorise vos documents pour mettre en avant votre profil auprès des propriétaires.
    </p>
    <div style="text-align:center;">
      <a href="${params.loginUrl}" class="btn" style="background:#c4976a;">Accéder à mon dossier</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:13px;color:#5a5754;">Avec votre dossier Bailio :</p>
    <p class="text" style="font-size:13px;line-height:2;">
      ✓ Téléchargez vos documents une seule fois<br/>
      ✓ Postulez en 1 clic pour tous les biens<br/>
      ✓ Signature du bail en ligne
    </p>
  `),
})

export const contractSignatureReminderTemplate = (params: {
  firstName: string
  contractTitle: string
  signingUrl: string
  role: 'OWNER' | 'TENANT'
  daysElapsed: number
}) => ({
  subject: `Rappel : votre contrat attend votre signature — Bailio`,
  html: BASE(`
    <div class="overline">Contrat en attente</div>
    <div class="title">Bonjour ${params.firstName},<br>votre signature est attendue</div>
    <p class="text">
      Le contrat <strong>${params.contractTitle}</strong> a été envoyé il y a
      <strong>${params.daysElapsed} jour${params.daysElapsed > 1 ? 's' : ''}</strong>
      et attend toujours votre signature.
    </p>
    <p class="text">
      La signature prend moins de 2 minutes directement depuis votre espace personnel.
    </p>
    <div style="text-align:center;">
      <a href="${params.signingUrl}" class="btn">Signer maintenant →</a>
    </div>
    <div class="warning">
      Si vous ne signez pas, le propriétaire pourra annuler le contrat et proposer le bien à un autre candidat.
    </div>
  `),
})

export const onboardingReminderJ7Template = (params: {
  firstName: string
  loginUrl: string
  role: 'OWNER' | 'TENANT'
}) => ({
  subject: 'Votre compte Bailio vous attend',
  html: BASE(
    params.role === 'OWNER'
      ? `
    <div class="overline">Pour les propriétaires</div>
    <div class="title">Votre bien n'est pas encore publié</div>
    <p class="text">
      Bonjour ${params.firstName}, ça prend 5 minutes. Des locataires recherchent en ce moment un bien comme le vôtre.
      Ne laissez pas votre logement inoccupé plus longtemps.
    </p>
    <div style="text-align:center;">
      <a href="${params.loginUrl}" class="btn">Reprendre où j'en étais</a>
    </div>
      `
      : `
    <div class="overline">Pour les locataires</div>
    <div class="title">Votre dossier est incomplet</div>
    <p class="text">
      Bonjour ${params.firstName}, un dossier complet = 3x plus de chances d'être accepté.
      Les propriétaires choisissent en priorité les candidats avec un dossier finalisé.
    </p>
    <div style="text-align:center;">
      <a href="${params.loginUrl}" class="btn" style="background:#c4976a;">Reprendre où j'en étais</a>
    </div>
      `
  ),
})
