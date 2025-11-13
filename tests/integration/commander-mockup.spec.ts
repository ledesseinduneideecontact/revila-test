import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Commander Mockup Positioning', () => {
  test.beforeEach(async ({ page }) => {
    // Créer des fichiers de test si nécessaire
    await createTestMediaFiles();

    // Naviguer vers la page commander
    await page.goto('/commander', { waitUntil: 'domcontentloaded' });

    // Attendre que le wizard soit visible
    await page.waitForSelector('text=Choisissez votre format', { timeout: 10000 });
  });

  test('Vidéo paysage + Photo portrait - positioning test', async ({ page }) => {
    console.log('=== TEST: Vidéo paysage + Photo portrait ===');

    // Étape 1: Upload vidéo paysage
    await test.step('Upload landscape video', async () => {
      const videoInput = page.locator('input[type="file"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-landscape.mp4'));

      // Attendre que la vidéo soit chargée
      await page.waitForTimeout(2000);

      // Vérifier l'orientation détectée
      const orientationText = await page.textContent('body');
      console.log('Orientation vidéo détectée:', orientationText?.includes('landscape') ? 'landscape' : 'portrait');
    });

    // Passer à l'étape 2
    await test.step('Go to step 2', async () => {
      const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Continuer")').first();
      await nextButton.click();
      await page.waitForTimeout(1000);
    });

    // Étape 2: Upload photo portrait
    await test.step('Upload portrait photo', async () => {
      const photoInput = page.locator('input[type="file"]').last();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-portrait.jpg'));

      // Attendre que la photo soit chargée et le crop terminé
      await page.waitForTimeout(2000);

      // Cliquer sur "Valider le cadrage" si présent
      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Confirmer")').first();
      if (await validateButton.isVisible()) {
        await validateButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // Capturer et analyser le mockup
    await test.step('Analyze mockup positioning', async () => {
      // Prendre une capture d'écran du mockup combiné
      const mockupContainer = page.locator('div.relative:has(img[src*="phone-landscape-card-portrait"])').first();

      if (await mockupContainer.isVisible()) {
        await mockupContainer.screenshot({
          path: path.join(__dirname, 'screenshots', 'mockup-landscape-portrait.png')
        });
        console.log('Screenshot saved: mockup-landscape-portrait.png');

        // Vérifier que les éléments sont présents
        const phoneVideo = mockupContainer.locator('video');
        const cardImage = mockupContainer.locator('img[src*="blob:"]');

        const phoneVisible = await phoneVideo.isVisible();
        const cardVisible = await cardImage.count() > 0;

        console.log('Phone video visible:', phoneVisible);
        console.log('Card image visible:', cardVisible);

        // Obtenir les styles calculés
        if (phoneVisible) {
          const phoneBox = await phoneVideo.boundingBox();
          console.log('Phone video bounding box:', phoneBox);
        }

        // Log the HTML structure
        const html = await mockupContainer.innerHTML();
        console.log('Mockup HTML structure:', html);

        expect(phoneVisible).toBe(true);
        expect(cardVisible).toBe(true);
      } else {
        console.error('Mockup container not found!');
        await page.screenshot({ path: path.join(__dirname, 'screenshots', 'page-error.png'), fullPage: true });
      }
    });
  });

  test('Vidéo portrait + Photo paysage - positioning test', async ({ page }) => {
    console.log('=== TEST: Vidéo portrait + Photo paysage ===');

    // Étape 1: Upload vidéo portrait
    await test.step('Upload portrait video', async () => {
      const videoInput = page.locator('input[type="file"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-portrait.mp4'));
      await page.waitForTimeout(2000);
    });

    // Passer à l'étape 2
    await test.step('Go to step 2', async () => {
      const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Continuer")').first();
      await nextButton.click();
      await page.waitForTimeout(1000);
    });

    // Étape 2: Upload photo paysage
    await test.step('Upload landscape photo', async () => {
      const photoInput = page.locator('input[type="file"]').last();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-landscape.jpg'));
      await page.waitForTimeout(2000);

      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Confirmer")').first();
      if (await validateButton.isVisible()) {
        await validateButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // Capturer et analyser
    await test.step('Analyze mockup positioning', async () => {
      const mockupContainer = page.locator('div.relative:has(img[src*="phone-portrait-card-landscape"])').first();

      if (await mockupContainer.isVisible()) {
        await mockupContainer.screenshot({
          path: path.join(__dirname, 'screenshots', 'mockup-portrait-landscape.png')
        });
        console.log('Screenshot saved: mockup-portrait-landscape.png');

        const phoneVideo = mockupContainer.locator('video');
        const phoneVisible = await phoneVideo.isVisible();

        console.log('Phone video visible:', phoneVisible);

        if (phoneVisible) {
          const phoneBox = await phoneVideo.boundingBox();
          console.log('Phone video bounding box:', phoneBox);
        }

        const html = await mockupContainer.innerHTML();
        console.log('Mockup HTML structure:', html);
      }
    });
  });
});

// Fonction helper pour créer des fichiers de test
async function createTestMediaFiles() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const screenshotsDir = path.join(__dirname, 'screenshots');

  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Utiliser ffmpeg pour créer des vidéos de test si pas déjà présentes
  const videoLandscape = path.join(fixturesDir, 'video-landscape.mp4');
  const videoPortrait = path.join(fixturesDir, 'video-portrait.mp4');
  const photoLandscape = path.join(fixturesDir, 'photo-landscape.jpg');
  const photoPortrait = path.join(fixturesDir, 'photo-portrait.jpg');

  // Note: Ces fichiers doivent être créés manuellement ou via ffmpeg
  console.log('Test media files expected at:', fixturesDir);
}
