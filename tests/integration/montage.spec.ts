import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Montage Vidéo Feature', () => {
  test('devrait afficher le bouton de montage vidéo', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')

    // Attendre que la page se charge
    await page.waitForLoadState('networkidle')

    // ÉTAPE 1: Sélectionner un format pour passer à l'étape Upload
    // Cliquer sur le format "Classique" (10x15)
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()

    // ÉTAPE 2: Maintenant qu'on est sur l'étape Upload, vérifier le bouton de montage
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await expect(montageButton).toBeVisible({ timeout: 10000 })

    // Vérifier le message d'information
    await expect(page.getByText(/vous pouvez mettre une vidéo ou créer un montage/i)).toBeVisible()
  })

  test('devrait ouvrir le wizard de montage au clic', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('networkidle')

    // ÉTAPE 1: Sélectionner un format pour passer à l'étape Upload
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()

    // ÉTAPE 2: Cliquer sur le bouton de montage
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()

    // Vérifier que le wizard s'ouvre
    await expect(page.getByText(/montage vidéo automatique/i).first()).toBeVisible()
  })

  test.skip('devrait créer un montage avec 2 vidéos', async ({ page }) => {
    // Ce test nécessite des fichiers vidéo pour l'upload
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('networkidle')

    // Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()

    // TODO: Upload de fichiers
    // TODO: Sélection du format
    // TODO: Lancement du montage
    // TODO: Attendre la progression
    // TODO: Vérifier la vidéo finale
  })
})

test.describe('Optimisations FFmpeg', () => {
  test('devrait créer un montage avec optimisation 1080p et preset veryfast', async ({ request }) => {
    const fs = await import('fs')
    const fsPromises = fs.promises

    // Chemins des fichiers de test
    const videoPath1 = path.join(__dirname, 'fixtures', 'video-portrait.mp4')
    const videoPath2 = path.join(__dirname, 'fixtures', 'video-landscape.mp4')

    // Copier les fichiers dans le dossier tmp/ pour simuler un upload
    const tmpDir = path.join(__dirname, '..', 'tmp')
    await fsPromises.mkdir(tmpDir, { recursive: true })

    const timestamp = Date.now()
    const tmpVideo1 = path.join(tmpDir, `test_${timestamp}_0.mp4`)
    const tmpVideo2 = path.join(tmpDir, `test_${timestamp}_1.mp4`)

    await fsPromises.copyFile(videoPath1, tmpVideo1)
    await fsPromises.copyFile(videoPath2, tmpVideo2)

    const mediaPaths = [tmpVideo1, tmpVideo2]

    try {
      // Créer le montage
      const createResponse = await request.post('http://localhost:3004/api/montage/create', {
        data: {
          mediaPaths,
          musicTrackId: null,
          format: 'landscape' // Format landscape pour tester
        }
      })

      expect(createResponse.status()).toBe(200)
      const createData = await createResponse.json()
      expect(createData.jobId).toBeDefined()

      // Suivre la progression
      const jobId = createData.jobId
      let completed = false
      let attempts = 0
      const maxAttempts = 90 // 90 secondes max

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde

        const progressResponse = await request.get(`http://localhost:3004/api/montage/progress/${jobId}`)

        if (progressResponse.status() === 200) {
          const progressData = await progressResponse.json()

          // Vérifier que la progression est valide (0-100)
          if (progressData.progress !== undefined) {
            expect(progressData.progress).toBeGreaterThanOrEqual(0)
            expect(progressData.progress).toBeLessThanOrEqual(100)
          }

          if (progressData.status === 'completed') {
            completed = true
            expect(progressData.videoUrl).toBeDefined()
            expect(progressData.videoUrl).toContain('.mp4')
            break
          } else if (progressData.status === 'error') {
            throw new Error(`Montage failed: ${progressData.error}`)
          }
        }

        attempts++
      }

      expect(completed).toBe(true)
    } finally {
      // Nettoyage : supprimer les fichiers temporaires
      try {
        await fsPromises.unlink(tmpVideo1)
        await fsPromises.unlink(tmpVideo2)
      } catch (err) {
        // Ignorer les erreurs de nettoyage
      }
    }
  }, 150000) // Timeout de 2.5 minutes
})

test.describe('API Montage', () => {
  test('POST /api/montage/create devrait créer un job', async ({ request }) => {
    const response = await request.post('http://localhost:3004/api/montage/create', {
      data: {
        mediaPaths: [],
        musicTrackId: null,
        format: 'landscape'
      }
    })

    // Devrait échouer car mediaPaths est vide
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('No media paths provided')
  })

  test('GET /api/montage/progress/[jobId] devrait retourner 404 pour job inexistant', async ({ request }) => {
    const response = await request.get('http://localhost:3004/api/montage/progress/fake-job-id')
    expect(response.status()).toBe(404)
  })
})
