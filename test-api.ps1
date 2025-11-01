# Test de création de commande
Write-Host "🧪 Test de création de commande..." -ForegroundColor Green
Write-Host ""

# Créer une image PNG minimale (1x1 pixel rouge)
$pngBytes = [byte[]](
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x9E, 0xB3, 0x61,
    0x8C, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
)
[System.IO.File]::WriteAllBytes("test-photo.png", $pngBytes)

# Créer une vidéo MP4 minimale
$mp4Bytes = [byte[]](
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x6D, 0x64, 0x61, 0x74
)
[System.IO.File]::WriteAllBytes("test-video.mp4", $mp4Bytes)

Write-Host "✅ Fichiers de test créés" -ForegroundColor Green

# Préparer les données
$customerInfo = @{
    firstName = "Test"
    lastName = "Client"
    email = "test@example.com"
    phone = "0612345678"
    address = "123 Rue du Test"
    postalCode = "75001"
    city = "Paris"
    country = "France"
} | ConvertTo-Json -Compress

# Créer le formulaire multipart
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"customerInfo`"",
    "",
    $customerInfo,
    "--$boundary",
    "Content-Disposition: form-data; name=`"total`"",
    "",
    "10.49",
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][message]`"",
    "",
    "Message de test",
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][signature]`"",
    "",
    "Signature test",
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][photoSize]`"",
    "",
    "10x15",
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][withFrame]`"",
    "",
    "false"
)

# Ajouter les fichiers
$photoBytes = [System.IO.File]::ReadAllBytes("test-photo.png")
$videoBytes = [System.IO.File]::ReadAllBytes("test-video.mp4")

$photoHeader = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][photo]`"; filename=`"test-photo.png`"",
    "Content-Type: image/png",
    ""
) -join $LF

$videoHeader = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"items[0][video]`"; filename=`"test-video.mp4`"",
    "Content-Type: video/mp4",
    ""
) -join $LF

# Construire le body complet
$encoding = [System.Text.Encoding]::UTF8
$body = [System.IO.MemoryStream]::new()

# Ajouter les champs texte
$textBody = ($bodyLines -join $LF) + $LF
$body.Write($encoding.GetBytes($textBody), 0, $encoding.GetByteCount($textBody))

# Ajouter la photo
$body.Write($encoding.GetBytes($photoHeader + $LF), 0, $encoding.GetByteCount($photoHeader + $LF))
$body.Write($photoBytes, 0, $photoBytes.Length)
$body.Write($encoding.GetBytes($LF), 0, 2)

# Ajouter la vidéo
$body.Write($encoding.GetBytes($videoHeader + $LF), 0, $encoding.GetByteCount($videoHeader + $LF))
$body.Write($videoBytes, 0, $videoBytes.Length)
$body.Write($encoding.GetBytes($LF), 0, 2)

# Ajouter la fin du boundary
$endBoundary = "--$boundary--$LF"
$body.Write($encoding.GetBytes($endBoundary), 0, $encoding.GetByteCount($endBoundary))

$bodyArray = $body.ToArray()

Write-Host "📤 Envoi de la requête à l'API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/orders/create-with-payment" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyArray `
        -UseBasicParsing

    Write-Host "✅ Succès! Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "📊 Résultat:" -ForegroundColor Cyan
    Write-Host "- Order ID: $($result.orderId)"
    Write-Host "- Order Number: $($result.orderNumber)"
    $hasSecret = if($result.clientSecret) { "✓ Présent" } else { "✗ Manquant" }
    Write-Host "- Client Secret: $hasSecret"
    Write-Host "- Files Uploaded: $($result.filesUploaded)"
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Détails: $errorBody" -ForegroundColor Red
    }
}
finally {
    # Nettoyer les fichiers de test
    Remove-Item -Path "test-photo.png", "test-video.mp4" -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "🧹 Fichiers de test supprimés" -ForegroundColor Gray
}