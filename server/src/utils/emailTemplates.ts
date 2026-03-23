/**
 * Email templates — ImmoParticuliers
 * Design cohérent avec le DA "Maison" (Cormorant Garamond + DM Sans, #1a1a2e, #c4976a)
 */

const BASE = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ImmoParticuliers</title>
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
      <div class="header-logo">Immo<span>Particuliers</span></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>ImmoParticuliers — Plateforme de gestion locative</p>
      <p style="margin-top:6px;">Vous recevez cet email car vous avez un compte sur notre plateforme.</p>
    </div>
  </div>
</body>
</html>
`

export const emailVerificationTemplate = (params: {
  firstName: string
  verifyUrl: string
}) => ({
  subject: 'Vérifiez votre adresse email — ImmoParticuliers',
  html: BASE(`
    <div class="overline">Vérification du compte</div>
    <div class="title">Bonjour ${params.firstName},<br>confirmez votre email</div>
    <p class="text">
      Merci de vous être inscrit sur ImmoParticuliers. Pour activer votre compte et accéder à toutes les fonctionnalités, cliquez sur le bouton ci-dessous.
    </p>
    <div style="text-align:center;">
      <a href="${params.verifyUrl}" class="btn">Vérifier mon adresse email</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:12px;">
      Ou copiez ce lien dans votre navigateur :<br/>
      <a href="${params.verifyUrl}" class="link">${params.verifyUrl}</a>
    </p>
    <div class="warning">
      Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
    </div>
  `),
})

export const passwordResetTemplate = (params: {
  firstName: string
  resetUrl: string
}) => ({
  subject: 'Réinitialisation de votre mot de passe — ImmoParticuliers',
  html: BASE(`
    <div class="overline">Sécurité du compte</div>
    <div class="title">Réinitialiser votre mot de passe</div>
    <p class="text">
      Bonjour <strong>${params.firstName}</strong>, vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
    </p>
    <div style="text-align:center;">
      <a href="${params.resetUrl}" class="btn">Choisir un nouveau mot de passe</a>
    </div>
    <hr class="divider" />
    <p class="text" style="font-size:12px;">
      Ou copiez ce lien dans votre navigateur :<br/>
      <a href="${params.resetUrl}" class="link">${params.resetUrl}</a>
    </p>
    <div class="warning">
      Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.
    </div>
  `),
})

export const phoneOtpTemplate = (params: {
  firstName: string
  code: string
}) => ({
  subject: 'Votre code de vérification — ImmoParticuliers',
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
  subject: 'Bienvenue sur ImmoParticuliers !',
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
  subject: 'Votre lien de connexion — ImmoParticuliers',
  html: BASE(`
    <div class="overline">Connexion sécurisée</div>
    <div class="title">Votre lien de connexion</div>
    <p class="text">
      Cliquez sur le bouton ci-dessous pour vous connecter instantanément à votre espace ImmoParticuliers. Aucun mot de passe requis.
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
