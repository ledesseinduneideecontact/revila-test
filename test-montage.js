/**
 * Script de test pour le montage vidéo
 * Usage: node test-montage.js
 */

const testMontage = async () => {
  const mediaPaths = [
    {
      path: 'C:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\tmp\\media_1762693758994_0_Revila_-_photos__2_.png',
      type: 'image',
      duration: 3
    },
    {
      path: 'C:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\tmp\\media_1762693758994_1_ajust___5_.png',
      type: 'image',
      duration: 3
    }
  ]

  console.log('🚀 Testing montage creation with 2 images...')
  console.log('Media files:', mediaPaths)

  try {
    const response = await fetch('http://localhost:3004/api/montage/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaPaths,
        musicTrackId: null,
        format: 'landscape'
      }),
    })

    const data = await response.json()
    console.log('✅ API Response:', data)

    if (!data.success) {
      console.error('❌ Failed to create montage:', data)
      return
    }

    // Suivre la progression avec polling
    console.log('📊 Following progress...')

    const checkProgress = async () => {
      try {
        const progressRes = await fetch(`http://localhost:3004/api/montage/progress/${data.jobId}`)

        // Note: SSE retourne un stream, on va plutôt checker le job directement
        // Pour simplifier, on attend juste et vérifie les fichiers

        await new Promise(resolve => setTimeout(resolve, 60000)) // Attendre 60s

        console.log('✅ Test completed - check server logs for details')
        process.exit(0)

      } catch (error) {
        console.error('❌ Progress check error:', error)
        process.exit(1)
      }
    }

    checkProgress()

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Vérifier que le serveur tourne
fetch('http://localhost:3004')
  .then(() => {
    console.log('✅ Server is running')
    testMontage()
  })
  .catch(() => {
    console.error('❌ Server is not running on port 3004')
    process.exit(1)
  })
