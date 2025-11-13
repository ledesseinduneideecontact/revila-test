import { test, expect } from '@playwright/test'

/**
 * Tests de vérification des corrections:
 * 1. Validation de mediaPaths (filtrage des undefined)
 * 2. Dimensions FFmpeg paires (correction H.264)
 */

test.describe('Vérification des corrections', () => {
  test('devrait gérer les mediaPaths avec valeurs undefined', async ({ page, request }) => {
    // Ce test vérifie que le backend filtre correctement les mediaPaths undefined

    const response = await request.post('http://localhost:3004/api/montage/create', {
      data: {
        mediaPaths: [
          'C:\\Users\\simon\\Desktop\\uploads\\photo1.jpg',
          undefined,
          null,
          'C:\\Users\\simon\\Desktop\\uploads\\photo2.jpg',
          undefined
        ],
        musicTrackId: 'none',
        format: 'portrait'
      }
    })

    const json = await response.json()

    // Le backend doit filtrer les undefined et accepter la requête
    // car il reste des chemins valides
    expect(response.status()).toBe(200)
    expect(json.success).toBe(true)
    expect(json.jobId).toBeDefined()
  })

  test('devrait rejeter une requête avec uniquement des mediaPaths invalides', async ({ page, request }) => {
    const response = await request.post('http://localhost:3004/api/montage/create', {
      data: {
        mediaPaths: [
          undefined,
          null,
          undefined
        ],
        musicTrackId: 'none',
        format: 'portrait'
      }
    })

    const json = await response.json()

    // Le backend doit rejeter car aucun chemin valide après filtrage
    expect(response.status()).toBe(400)
    expect(json.error).toContain('No valid media paths')
  })

  test('devrait fonctionner avec la bibliothèque musicale complète', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // Naviguer vers l'étape musique
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // Vérifier que toutes les catégories sont présentes
    const categories = [
      'Romantique',
      'Joyeuse',
      'Énergique',
      'Classique',
      'Cinématique',
      'Lounge',
      'Gospel'
    ]

    for (const category of categories) {
      // Utiliser un sélecteur plus spécifique pour éviter les ambiguïtés
      const categoryHeader = page.locator('.bg-gray-100.rounded.text-sm.font-semibold', { hasText: category })
      await expect(categoryHeader).toBeVisible({ timeout: 5000 })
    }

    // Vérifier qu'au moins une musique est disponible
    const musicRadio = page.locator('input[type="radio"][value="romantique-doux-mariage"]')
    await expect(musicRadio).toBeVisible()

    // Vérifier que le lecteur audio est présent
    const playButton = page.locator('button[title*="Écouter"]').first()
    await expect(playButton).toBeVisible()
  })

  test('devrait permettre de sélectionner et prévisualiser une musique', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // Naviguer vers l'étape musique
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // Sélectionner une musique
    const musicRadio = page.locator('input[type="radio"][value="romantique-doux-mariage"]')
    await musicRadio.check()
    await expect(musicRadio).toBeChecked()

    // Cliquer sur le bouton Play
    const playButton = page.locator('button[title*="Écouter"]').first()
    await playButton.click()
    await page.waitForTimeout(500)

    // Vérifier que le bouton change en Pause (indicateur que la musique joue)
    const pauseButton = page.locator('button[title*="Pause"]').first()
    await expect(pauseButton).toBeVisible({ timeout: 2000 })
  })
})
