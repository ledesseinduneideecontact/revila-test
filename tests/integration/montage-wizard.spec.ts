import { test, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Test de la fonctionnalité de montage vidéo
 *
 * Ce test vérifie:
 * 1. Navigation vers la page Commander
 * 2. Sélection d'un format
 * 3. Upload d'une vidéo
 * 4. Affichage du bouton "Créer un montage vidéo automatique"
 * 5. Ouverture du modal MontageWizard
 * 6. Ajout de médias supplémentaires
 * 7. Réorganisation des médias (drag-drop)
 * 8. Sélection de musique
 * 9. Validation du formulaire
 */

test.describe('Video Montage Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Capturer les erreurs de la console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text())
      }
    })

    // Capturer les erreurs JavaScript
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message)
    })

    // Naviguer vers la page Commander
    await page.goto('http://localhost:3004/commander')

    // Attendre que la page soit chargée
    await page.waitForLoadState('domcontentloaded')

    // Attendre que les formats soient visibles
    await page.waitForSelector('text=Classique', { timeout: 10000 })
  })

  test('should display montage button after video upload', async ({ page }) => {
    // Étape 1: Sélectionner un format
    await test.step('Select format', async () => {
      // Attendre que la page soit complètement chargée
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // Debug: vérifier si le bouton a un onClick handler
      const hasHandler = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const classiqueButton = buttons.find(btn => btn.textContent?.includes('Classique'))
        return classiqueButton ? 'found' : 'not found'
      })
      console.log('Button status:', hasHandler)

      // Simuler un clic utilisateur complet (mousedown + mouseup + click)
      const classiqueButton = page.locator('button').filter({ hasText: /Classique/ }).first()
      await classiqueButton.scrollIntoViewIfNeeded()
      await classiqueButton.hover()
      await page.mouse.down()
      await page.mouse.up()

      // Attendre un délai pour le setTimeout de 300ms dans handleSelect
      await page.waitForTimeout(500)

      // Attendre que l'étape suivante s'affiche
      await expect(page.locator('text=Vidéo associée')).toBeVisible({ timeout: 10000 })
    })

    // Étape 2: Upload d'une vidéo de test
    await test.step('Upload video', async () => {
      // Utiliser un fichier vidéo de test existant
      const videoPath = path.join(__dirname, 'fixtures', 'video-landscape.mp4')

      // Localiser l'input file pour la vidéo
      const videoInput = page.locator('input[type="file"][accept="video/*"]')

      // Upload la vidéo
      await videoInput.setInputFiles(videoPath)

      // Attendre que la vidéo soit chargée
      await page.waitForSelector('video', { timeout: 15000 })

      // Vérifier que la vidéo est affichée
      await expect(page.locator('video')).toBeVisible()
    })

    // Étape 3: Vérifier l'affichage du bouton de montage
    await test.step('Check montage button visibility', async () => {
      // Le bouton "Créer un montage vidéo automatique" devrait être visible
      const montageButton = page.locator('button:has-text("Créer un montage vidéo automatique")')

      await expect(montageButton).toBeVisible()

      // Vérifier la couleur du bouton (purple-500)
      await expect(montageButton).toHaveClass(/bg-purple-500/)
    })

    // Étape 4: Cliquer sur le bouton de montage
    await test.step('Open montage wizard', async () => {
      await page.click('button:has-text("Créer un montage vidéo automatique")')

      // Attendre que le modal s'ouvre
      await page.waitForSelector('text=Créer un montage vidéo', { timeout: 5000 })

      // Vérifier que le modal est visible
      await expect(page.locator('h2:has-text("Créer un montage vidéo")')).toBeVisible()
    })
  })

  test('should allow adding media and selecting music in montage wizard', async ({ page }) => {
    // Pré-requis: naviguer vers le wizard avec une vidéo déjà uploadée
    // (similaire au test précédent)

    // Étape 1: Ouvrir le wizard
    await test.step('Navigate to montage wizard', async () => {
      // Sélectionner format
      await page.locator('button').filter({ hasText: /Classique/ }).first().click()
      await page.waitForSelector('text=Vidéo associée', { timeout: 10000 })

      // Upload vidéo
      const videoPath = path.join(__dirname, 'fixtures', 'video-landscape.mp4')
      const videoInput = page.locator('input[type="file"][accept="video/*"]')
      await videoInput.setInputFiles(videoPath)
      await page.waitForSelector('video', { timeout: 15000 })

      // Ouvrir le wizard
      await page.click('button:has-text("Créer un montage vidéo automatique")')
      await page.waitForSelector('text=Créer un montage vidéo')
    })

    // Étape 2: Vérifier que la vidéo initiale est déjà dans le wizard
    await test.step('Check initial video in wizard', async () => {
      // La vidéo initiale devrait déjà être affichée
      const mediaItems = page.locator('[class*="sortable"]')

      // Au moins 1 média devrait être présent (la vidéo initiale)
      await expect(mediaItems).toHaveCount(1)
    })

    // Étape 3: Ajouter des photos/vidéos supplémentaires
    await test.step('Add additional media', async () => {
      // Localiser l'input file pour ajouter des médias
      const addMediaInput = page.locator('input[type="file"][accept="image/*,video/*"][multiple]')

      // Ajouter 2 photos de test
      const photo1Path = path.join(__dirname, 'fixtures', 'photo-landscape.jpg')
      const photo2Path = path.join(__dirname, 'fixtures', 'photo-portrait.jpg')

      await addMediaInput.setInputFiles([photo1Path, photo2Path])

      // Attendre que les médias soient ajoutés
      await page.waitForTimeout(1000)

      // Vérifier qu'on a maintenant 3 médias (1 vidéo + 2 photos)
      const mediaItems = page.locator('[class*="sortable"]')
      await expect(mediaItems).toHaveCount(3)
    })

    // Étape 4: Modifier la durée d'une photo
    await test.step('Modify photo duration', async () => {
      // Localiser l'input de durée pour la première photo
      const durationInput = page.locator('input[type="number"][min="1"][max="10"]').first()

      // Vérifier que la durée par défaut est 2 secondes
      await expect(durationInput).toHaveValue('2')

      // Modifier la durée à 5 secondes
      await durationInput.fill('5')

      // Vérifier la nouvelle valeur
      await expect(durationInput).toHaveValue('5')
    })

    // Étape 5: Sélectionner une musique
    await test.step('Select background music', async () => {
      // Par défaut, "Aucune musique" devrait être sélectionné
      const noMusicRadio = page.locator('input[type="radio"][value="none"]')
      await expect(noMusicRadio).toBeChecked()

      // Sélectionner "Musique joyeuse"
      await page.click('input[type="radio"][value="happy"]')

      // Vérifier que la musique joyeuse est sélectionnée
      const happyMusicRadio = page.locator('input[type="radio"][value="happy"]')
      await expect(happyMusicRadio).toBeChecked()
    })

    // Étape 6: Vérifier le bouton de création
    await test.step('Check create button', async () => {
      const createButton = page.locator('button:has-text("Créer le montage")')

      // Le bouton devrait être visible et actif
      await expect(createButton).toBeVisible()
      await expect(createButton).toBeEnabled()
    })
  })

  test('should handle drag and drop reordering', async ({ page }) => {
    // Pré-requis: wizard ouvert avec plusieurs médias

    await test.step('Setup wizard with multiple media', async () => {
      // Sélectionner format
      await page.locator('button').filter({ hasText: /Classique/ }).first().click()
      await page.waitForSelector('text=Vidéo associée', { timeout: 10000 })

      // Upload vidéo
      const videoPath = path.join(__dirname, 'fixtures', 'video-landscape.mp4')
      const videoInput = page.locator('input[type="file"][accept="video/*"]')
      await videoInput.setInputFiles(videoPath)
      await page.waitForSelector('video', { timeout: 15000 })

      // Ouvrir le wizard
      await page.click('button:has-text("Créer un montage vidéo automatique")')
      await page.waitForSelector('text=Créer un montage vidéo')

      // Ajouter des photos
      const addMediaInput = page.locator('input[type="file"][accept="image/*,video/*"][multiple]')
      const photo1Path = path.join(__dirname, 'fixtures', 'photo-landscape.jpg')
      const photo2Path = path.join(__dirname, 'fixtures', 'photo-portrait.jpg')
      await addMediaInput.setInputFiles([photo1Path, photo2Path])
      await page.waitForTimeout(1000)
    })

    await test.step('Test drag and drop', async () => {
      // Obtenir les éléments médias
      const mediaItems = page.locator('[class*="sortable"]')
      await expect(mediaItems).toHaveCount(3)

      // Obtenir le premier et le dernier élément
      const firstItem = mediaItems.first()
      const lastItem = mediaItems.last()

      // Récupérer le nom du premier fichier avant le drag
      const firstFileName = await firstItem.locator('p[class*="truncate"]').textContent()

      // Effectuer le drag and drop (premier vers dernier)
      await firstItem.dragTo(lastItem)

      // Attendre que l'animation se termine
      await page.waitForTimeout(500)

      // Vérifier que l'ordre a changé
      // Le dernier élément devrait maintenant avoir le nom du premier fichier d'origine
      const newLastFileName = await mediaItems.last().locator('p[class*="truncate"]').textContent()
      expect(newLastFileName).toBe(firstFileName)
    })
  })

  test('should close wizard on cancel', async ({ page }) => {
    await test.step('Open and close wizard', async () => {
      // Ouvrir le wizard (étapes standard)
      await page.locator('button').filter({ hasText: /Classique/ }).first().click()
      await page.waitForSelector('text=Vidéo associée', { timeout: 10000 })

      const videoPath = path.join(__dirname, 'fixtures', 'video-landscape.mp4')
      const videoInput = page.locator('input[type="file"][accept="video/*"]')
      await videoInput.setInputFiles(videoPath)
      await page.waitForSelector('video', { timeout: 15000 })

      await page.click('button:has-text("Créer un montage vidéo automatique")')
      await page.waitForSelector('text=Créer un montage vidéo')

      // Vérifier que le modal est ouvert
      await expect(page.locator('h2:has-text("Créer un montage vidéo")')).toBeVisible()

      // Cliquer sur le bouton "Annuler"
      await page.click('button:has-text("Annuler")')

      // Attendre que le modal se ferme
      await page.waitForTimeout(500)

      // Vérifier que le modal est fermé
      await expect(page.locator('h2:has-text("Créer un montage vidéo")')).not.toBeVisible()
    })
  })

  test('should show validation error if no media', async ({ page }) => {
    // Note: Ce test suppose qu'on puisse ouvrir le wizard sans vidéo initiale
    // Si ce n'est pas le cas, ce test peut être ignoré

    await test.step('Try to create montage without media', async () => {
      // TODO: Implémenter ce test si le wizard peut être ouvert sans vidéo
    })
  })
})

/**
 * Instructions pour exécuter ces tests:
 *
 * 1. Les fichiers de test sont déjà présents dans tests/fixtures/:
 *    - video-landscape.mp4 (vidéo de test)
 *    - photo-landscape.jpg (image de test)
 *    - photo-portrait.jpg (image de test)
 *
 * 2. Installer Playwright si nécessaire:
 *    npm install --save-dev @playwright/test
 *    npx playwright install
 *
 * 3. S'assurer que le serveur de développement est en cours d'exécution:
 *    npm run dev (sur le port 3004)
 *
 * 4. Exécuter les tests:
 *    npx playwright test tests/montage-wizard.spec.ts
 *
 * 5. Exécuter les tests en mode UI (pour voir l'exécution):
 *    npx playwright test tests/montage-wizard.spec.ts --ui
 *
 * 6. Exécuter les tests en mode debug:
 *    npx playwright test tests/montage-wizard.spec.ts --debug
 */
