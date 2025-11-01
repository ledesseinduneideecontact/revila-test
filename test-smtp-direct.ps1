# Script PowerShell pour tester SMTP directement
# Modifiez les variables ci-dessous avec vos informations

$SmtpServer = "smtp.gmail.com"
$SmtpPort = 587
$Username = "votre-email@revila.fr"  # MODIFIEZ ICI
$Password = "votre-mot-de-passe"     # MODIFIEZ ICI
$From = "noreply@revila.fr"          # MODIFIEZ ICI
$To = "test@example.com"             # MODIFIEZ ICI

# Créer les credentials
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential ($Username, $SecurePassword)

# Créer le message
$Subject = "Test SMTP REVILA"
$Body = "Ceci est un test d'envoi SMTP pour REVILA"

# Essayer d'envoyer
try {
    Send-MailMessage -From $From -To $To -Subject $Subject -Body $Body -SmtpServer $SmtpServer -Port $SmtpPort -UseSsl -Credential $Credential
    Write-Host "✅ Email envoyé avec succès!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur d'envoi:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}