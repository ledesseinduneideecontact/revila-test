# 📧 Templates d'Emails REVILA - Design Moderne

## 🎨 **Style Global (à inclure dans chaque template)**

```html
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    background-color: #f8f9fa;
  }
  
  .wrapper {
    width: 100%;
    padding: 40px 20px;
    background-color: #f8f9fa;
  }
  
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }
  
  .header {
    background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
    padding: 40px 40px 35px;
    text-align: center;
  }
  
  .logo {
    font-size: 36px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -1px;
    margin-bottom: 8px;
  }
  
  .tagline {
    color: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    font-weight: 500;
  }
  
  .content {
    padding: 40px;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
  }
  
  p {
    color: #4a5568;
    font-size: 16px;
    line-height: 1.7;
    margin-bottom: 20px;
  }
  
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
    color: white;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
    transition: transform 0.2s;
  }
  
  .button:hover {
    transform: translateY(-2px);
  }
  
  .feature-box {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
  }
  
  .feature-list {
    list-style: none;
    padding: 0;
  }
  
  .feature-list li {
    padding: 10px 0;
    padding-left: 28px;
    position: relative;
    color: #4a5568;
  }
  
  .feature-list li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #ff6b35;
    font-weight: bold;
    font-size: 18px;
  }
  
  .alert {
    background: #fff5f5;
    border-left: 4px solid #ff6b35;
    padding: 16px;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .alert-info {
    background: #eff6ff;
    border-left-color: #3b82f6;
  }
  
  .footer {
    background: #f8f9fa;
    padding: 32px 40px;
    text-align: center;
    border-top: 1px solid #e5e7eb;
  }
  
  .footer p {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  
  .footer a {
    color: #ff6b35;
    text-decoration: none;
  }
  
  .social-links {
    margin-top: 20px;
  }
  
  .social-links a {
    display: inline-block;
    margin: 0 8px;
    color: #9ca3af;
    text-decoration: none;
  }
  
  @media only screen and (max-width: 600px) {
    .content {
      padding: 24px;
    }
    
    .header {
      padding: 32px 24px;
    }
    
    h1 {
      font-size: 20px;
    }
    
    .button {
      display: block;
      text-align: center;
    }
  }
</style>
```

---

## 1️⃣ **Confirmation d'inscription**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue chez REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Bienvenue dans la magie ✨</h1>
        
        <p>
          Félicitations ! Vous venez de faire le premier pas vers des souvenirs qui prennent vie.
        </p>
        
        <p>
          Confirmez votre inscription pour débloquer toutes les fonctionnalités de REVILA :
        </p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Confirmer mon compte
          </a>
        </div>
        
        <div class="feature-box">
          <p style="font-weight: 600; margin-bottom: 16px; color: #1a1a1a;">
            Avec votre compte REVILA :
          </p>
          <ul class="feature-list">
            <li>Sauvegardez vos créations en cours</li>
            <li>Reprenez votre commande où vous voulez</li>
            <li>Accédez à votre historique de commandes</li>
            <li>Bénéficiez d'offres exclusives</li>
          </ul>
        </div>
        
        <div class="alert">
          <p style="margin: 0; font-size: 14px;">
            <strong>⏱ Ce lien expire dans 24 heures</strong><br>
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p>© 2024 REVILA - Tous droits réservés</p>
        <p>
          <a href="https://revila.fr">revila.fr</a> • 
          <a href="mailto:contact@revila.fr">contact@revila.fr</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 2️⃣ **Réinitialisation du mot de passe**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation - REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Réinitialisez votre mot de passe</h1>
        
        <p>
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte REVILA.
        </p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Créer un nouveau mot de passe
          </a>
        </div>
        
        <div class="alert-info alert">
          <p style="margin: 0; font-size: 14px;">
            <strong>💡 Conseils pour un mot de passe sécurisé :</strong><br>
            • Minimum 8 caractères<br>
            • Mélangez lettres, chiffres et symboles<br>
            • Évitez les informations personnelles
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, 
          votre mot de passe actuel reste inchangé et vous pouvez ignorer cet email.
        </p>
      </div>
      
      <div class="footer">
        <p>Besoin d'aide ? Contactez-nous à <a href="mailto:support@revila.fr">support@revila.fr</a></p>
        <p>© 2024 REVILA • <a href="https://revila.fr">revila.fr</a></p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 3️⃣ **Lien magique (connexion sans mot de passe)**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion rapide - REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Connexion en un clic 🚀</h1>
        
        <p>
          Cliquez sur le bouton ci-dessous pour vous connecter instantanément à votre compte REVILA.
        </p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Me connecter maintenant
          </a>
        </div>
        
        <div class="alert">
          <p style="margin: 0; font-size: 14px;">
            <strong>🔒 Sécurité</strong><br>
            Ce lien est unique et expire dans 1 heure.<br>
            Il ne peut être utilisé qu'une seule fois.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Vous n'avez pas demandé ce lien ?<br>
          Ignorez cet email, votre compte reste sécurisé.
        </p>
      </div>
      
      <div class="footer">
        <p>© 2024 REVILA • <a href="https://revila.fr">revila.fr</a></p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 4️⃣ **Changement d'email**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Changement d'email - REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Confirmez votre nouvelle adresse email</h1>
        
        <p>
          Vous avez demandé à changer votre adresse email sur REVILA.
        </p>
        
        <div class="feature-box" style="text-align: center;">
          <p style="margin: 8px 0; font-size: 14px;">
            <span style="color: #6b7280;">Ancienne :</span> <strong>{{ .OldEmail }}</strong>
          </p>
          <p style="margin: 8px 0; font-size: 20px;">↓</p>
          <p style="margin: 8px 0; font-size: 14px;">
            <span style="color: #6b7280;">Nouvelle :</span> <strong style="color: #ff6b35;">{{ .NewEmail }}</strong>
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Confirmer le changement
          </a>
        </div>
        
        <div class="alert">
          <p style="margin: 0; font-size: 14px;">
            <strong>⚠️ Important</strong><br>
            Si vous n'avez pas demandé ce changement, connectez-vous immédiatement 
            à votre compte et modifiez votre mot de passe.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p>Sécurité : <a href="mailto:security@revila.fr">security@revila.fr</a></p>
        <p>© 2024 REVILA • <a href="https://revila.fr">revila.fr</a></p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5️⃣ **Invitation**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation - REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Vous êtes invité(e) ! 🎉</h1>
        
        <p>
          <strong>{{ .SenderName }}</strong> vous invite à découvrir REVILA et créer 
          des souvenirs magiques ensemble.
        </p>
        
        <div class="feature-box" style="background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);">
          <p style="text-align: center; font-size: 18px; color: #ff6b35; margin: 12px 0;">
            "Transformez vos photos en souvenirs vivants"
          </p>
        </div>
        
        <p>
          <strong>Comment ça marche ?</strong><br>
          Imprimez vos photos avec une puce NFC intégrée. Posez votre téléphone 
          dessus et votre vidéo s'ouvre comme par magie !
        </p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Accepter l'invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Rejoignez des milliers de personnes qui donnent vie à leurs souvenirs.
        </p>
      </div>
      
      <div class="footer">
        <p>Découvrez la magie sur <a href="https://revila.fr">revila.fr</a></p>
        <p>© 2024 REVILA - Photos magiques qui prennent vie</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 6️⃣ **Ré-authentification**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérification de sécurité - REVILA</title>
  [STYLE CI-DESSUS]
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">REVILA</div>
        <div class="tagline">Photos magiques qui prennent vie</div>
      </div>
      
      <div class="content">
        <h1>Vérification de sécurité 🔐</h1>
        
        <p>
          Pour protéger votre compte, nous devons confirmer votre identité avant 
          de procéder à cette action sensible.
        </p>
        
        <div class="alert-info alert">
          <p style="margin: 0;">
            <strong>Action demandée :</strong><br>
            {{ .Action }}
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Confirmer mon identité
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          <strong>🕐 Ce lien expire dans 15 minutes</strong><br>
          Si vous n'êtes pas à l'origine de cette demande, changez immédiatement 
          votre mot de passe ou contactez notre support.
        </p>
      </div>
      
      <div class="footer">
        <p>Support : <a href="mailto:support@revila.fr">support@revila.fr</a></p>
        <p>© 2024 REVILA • <a href="https://revila.fr">revila.fr</a></p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 📝 **Notes d'implémentation**

### Variables Supabase disponibles :
- `{{ .ConfirmationURL }}` - Lien de confirmation
- `{{ .Email }}` - Email de l'utilisateur  
- `{{ .OldEmail }}` / `{{ .NewEmail }}` - Pour changement d'email
- `{{ .SenderName }}` - Nom de l'invitant
- `{{ .Action }}` - Action demandée (ré-auth)
- `{{ .SiteURL }}` - URL de votre site

### Design moderne avec :
- ✅ Gradient orange signature de REVILA
- ✅ Typographie moderne et lisible
- ✅ Espacement généreux
- ✅ Responsive mobile-first
- ✅ Boutons avec hover effects
- ✅ Alertes visuelles claires
- ✅ Footer professionnel

### Configuration Supabase :
Copiez chaque template HTML complet (avec le style) dans les champs correspondants de Supabase Email Templates.