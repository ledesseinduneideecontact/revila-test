# 📧 Templates d'Emails Supabase en Français



## 2️⃣ **Invite User** (Invitation utilisateur)

### Sujet :
```
{{ .SenderName }} vous invite à rejoindre Revive Photos
```

### Corps HTML :
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Mêmes styles que ci-dessus */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📨 Vous avez reçu une invitation !</h1>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      
      <p><strong>{{ .SenderName }}</strong> vous invite à découvrir <strong>Revive Photos</strong> et à créer ensemble des souvenirs magiques !</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-style: italic; color: #555;">
          "Rejoignez-moi sur Revive Photos pour créer des photos qui prennent vie grâce à la magie NFC !"
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">🎁 Accepter l'invitation</a>
      </div>
      
      <p><strong>Qu'est-ce que Revive Photos ?</strong></p>
      <p>Transformez vos photos en souvenirs interactifs : posez votre téléphone sur la photo imprimée et regardez votre vidéo s'ouvrir automatiquement !</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe Revive Photos</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 3️⃣ **Magic Link** (Connexion sans mot de passe)

### Sujet :
```
Votre lien de connexion rapide - Revive Photos
```

### Corps HTML :
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Connexion rapide</h1>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      
      <p>Vous avez demandé un lien de connexion rapide pour accéder à votre compte Revive Photos.</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">🚀 Me connecter maintenant</a>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404;">
          <strong>⏱️ Attention :</strong> Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.
        </p>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Si vous n'avez pas demandé ce lien, ignorez cet email. Votre compte reste sécurisé.
      </p>
      
      <p>Bonne création !<br>
      <strong>L'équipe Revive Photos</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 4️⃣ **Change Email Address** (Changement d'adresse email)

### Sujet :
```
Confirmez votre nouvelle adresse email - Revive Photos
```

### Corps HTML :
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      <h1>📮 Changement d'adresse email</h1>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      
      <p>Vous avez demandé à changer votre adresse email sur Revive Photos.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Ancienne adresse :</strong> {{ .OldEmail }}</p>
        <p><strong>Nouvelle adresse :</strong> {{ .NewEmail }}</p>
      </div>
      
      <p>Pour confirmer ce changement, cliquez sur le bouton ci-dessous :</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">✅ Confirmer le changement</a>
      </div>
      
      <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
        <p style="margin: 0; color: #721c24;">
          <strong>🔒 Sécurité :</strong> Si vous n'avez pas demandé ce changement, connectez-vous immédiatement à votre compte et modifiez votre mot de passe.
        </p>
      </div>
      
      <p>Cordialement,<br>
      <strong>L'équipe Revive Photos</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 5️⃣ **Reset Password** (Réinitialisation du mot de passe)

### Sujet :
```
Réinitialisez votre mot de passe - Revive Photos
```

### Corps HTML :
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Réinitialisation du mot de passe</h1>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      
      <p>Vous avez demandé à réinitialiser votre mot de passe sur Revive Photos.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">🔑 Créer un nouveau mot de passe</a>
      </div>
      
      <p><strong>Conseils pour un mot de passe sécurisé :</strong></p>
      <ul>
        <li>✅ Au moins 8 caractères</li>
        <li>✅ Mélangez majuscules et minuscules</li>
        <li>✅ Incluez des chiffres et symboles</li>
        <li>❌ Évitez les mots du dictionnaire</li>
      </ul>
      
      <p style="color: #666; font-size: 14px;">
        Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.
      </p>
      
      <p>Cordialement,<br>
      <strong>L'équipe Revive Photos</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 6️⃣ **Reauthentication** (Ré-authentification)

### Sujet :
```
Confirmation de sécurité requise - Revive Photos
```

### Corps HTML :
```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Vérification de sécurité</h1>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      
      <p>Pour des raisons de sécurité, nous devons vérifier votre identité avant de procéder à une action sensible sur votre compte.</p>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3;">
        <p style="margin: 0;">
          <strong>Action demandée :</strong> {{ .Action }}
        </p>
      </div>
      
      <p>Cliquez sur le bouton ci-dessous pour confirmer qu'il s'agit bien de vous :</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">🔒 Confirmer mon identité</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Ce lien expire dans 15 minutes pour votre sécurité. Si vous n'êtes pas à l'origine de cette demande, changez immédiatement votre mot de passe.
      </p>
      
      <p>La sécurité de votre compte est notre priorité.<br>
      <strong>L'équipe Revive Photos</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 🎨 **Configuration dans Supabase Dashboard**

### Pour chaque template :

1. **Authentication → Email Templates**
2. Sélectionnez le template à modifier
3. **Enable Custom Email** : ✅ ON
4. Copiez le code HTML correspondant
5. **Variables disponibles** :
   - `{{ .ConfirmationURL }}` - Lien de confirmation
   - `{{ .SiteURL }}` - URL de votre site
   - `{{ .Email }}` - Email de l'utilisateur
   - `{{ .Token }}` - Token de confirmation

### URLs de redirection :
```
Site URL: https://revive-photos.fr
Redirect URLs: 
  - https://revive-photos.fr/auth/callback
  - https://revive-photos.fr/auth/reset-password
  - http://localhost:3002/auth/callback (dev)
```

### SMTP (optionnel pour emails custom) :
Si vous voulez utiliser votre propre serveur SMTP :
```
Host: smtp.gmail.com (ou votre serveur)
Port: 587
User: noreply@revive-photos.fr
From email: Revive Photos <noreply@revive-photos.fr>
```