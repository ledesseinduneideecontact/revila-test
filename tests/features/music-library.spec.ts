import { test, expect } from '@playwright/test'

test.describe('Bibliothèque Musicale', () => {
  test('devrait afficher la bibliothèque de musiques prédéfinies', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // ÉTAPE 1: Sélectionner un format pour passer à l'étape Upload
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 2: Cliquer sur le bouton de montage
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 3: Vérifier que le wizard s'ouvre
    await expect(page.getByText(/montage vidéo automatique/i).first()).toBeVisible({ timeout: 5000 })

    // ÉTAPE 4: Naviguer vers l'étape "Musique"
    // Trouver le bouton "Suivant" pour passer à l'étape de sélection de musique
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // ÉTAPE 5: Vérifier que les catégories de musique sont affichées
    await expect(page.getByText(/romantique/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/joyeuse/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/énergique/i)).toBeVisible({ timeout: 5000 })

    // ÉTAPE 6: Vérifier qu'au moins une musique prédéfinie est affichée
    await expect(page.getByText(/doux mariage/i)).toBeVisible({ timeout: 5000 })
  })

  test('devrait permettre de sélectionner une musique prédéfinie', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // ÉTAPE 1: Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 2: Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 3: Naviguer vers l'étape "Musique"
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // ÉTAPE 4: Sélectionner une musique prédéfinie (par exemple "Doux Mariage")
    const musicRadio = page.locator('input[type="radio"][value="romantique-doux-mariage"]')
    await musicRadio.check()

    // ÉTAPE 5: Vérifier que la musique est sélectionnée
    await expect(musicRadio).toBeChecked()
  })

  test('devrait afficher les descriptions des musiques', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // ÉTAPE 1: Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 2: Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 3: Naviguer vers l'étape "Musique"
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // ÉTAPE 4: Vérifier qu'au moins une description est affichée
    await expect(page.getByText(/mélodie douce pour cérémonies de mariage/i)).toBeVisible({ timeout: 5000 })
  })

  test('devrait permettre de sélectionner "Aucune musique"', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // ÉTAPE 1: Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 2: Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 3: Naviguer vers l'étape "Musique"
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // ÉTAPE 4: Vérifier que l'option "Aucune musique" est disponible
    const noMusicRadio = page.locator('input[type="radio"][value="none"]')
    await noMusicRadio.check()

    // ÉTAPE 5: Vérifier que "Aucune musique" est sélectionnée
    await expect(noMusicRadio).toBeChecked()
  })

  test('devrait afficher toutes les catégories de musique', async ({ page }) => {
    await page.goto('http://localhost:3004/commander')
    await page.waitForLoadState('domcontentloaded')

    // ÉTAPE 1: Sélectionner un format
    const formatButton = page.getByRole('button', { name: /Classique/i }).first()
    await formatButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 2: Ouvrir le wizard
    const montageButton = page.getByRole('button', { name: /créer un montage vidéo automatique/i })
    await montageButton.click()
    await page.waitForTimeout(1000)

    // ÉTAPE 3: Naviguer vers l'étape "Musique"
    const suivantButton = page.getByRole('button', { name: /suivant/i })
    if (await suivantButton.isVisible({ timeout: 2000 })) {
      await suivantButton.click()
      await page.waitForTimeout(1000)
    }

    // ÉTAPE 4: Vérifier que toutes les catégories sont affichées
    const categories = [
      'Romantique',
      'Joyeuse',
      'Énergique',
      'Électro',
      'Classique',
      'Cinématique',
      'Lounge',
      'Gospel'
    ]

    for (const category of categories) {
      await expect(page.getByText(category, { exact: false })).toBeVisible({ timeout: 5000 })
    }
  })
})
