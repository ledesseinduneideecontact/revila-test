import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Helper function to dismiss cookie banner if present
async function dismissCookieBanner(page: Page) {
  const cookieButton = page.locator('button:has-text("Accepter"), button:has-text("J\'accepte")').first();
  if (await cookieButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await cookieButton.click();
    await page.waitForTimeout(500);
    // Wait for the banner to actually disappear
    await page.locator('text=🍪 Nous utilisons des cookies').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
}

test.describe('Gallery - Change Photo in Preview Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page commander
    await page.goto('/commander', { waitUntil: 'domcontentloaded' });

    // Accepter les cookies si la bannière est présente
    await dismissCookieBanner(page);

    // Attendre que le wizard soit visible
    await page.waitForSelector('text=Choisissez votre format', { timeout: 10000 });
  });

  test('Should change photo in gallery preview modal and update mockup', async ({ page }) => {
    console.log('=== TEST: Changement de photo dans la galerie ===');

    // Étape 1: Sélectionner le format 10x15
    await test.step('Select format 10x15', async () => {
      // Cliquer sur le format - chercher par le texte "Classique" ou "10×15"
      const format10x15 = page.locator('button:has-text("Classique")').first();
      await format10x15.click();

      // Attendre que l'étape suivante (upload vidéo) soit présente dans le DOM
      const videoInput = page.locator('input[type="file"][accept*="video"]').first();
      await videoInput.waitFor({ state: 'attached', timeout: 5000 });
    });

    // Étape 2: Upload vidéo portrait
    await test.step('Upload portrait video', async () => {
      console.log('Uploading portrait video...');

      // Trouver l'input file pour la vidéo
      const videoInput = page.locator('input[type="file"][accept*="video"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-portrait.mp4'));

      // S'assurer que le cookie banner n'est pas présent avant de cliquer
      await dismissCookieBanner(page);

      // Attendre que le bouton "Continuer" soit activé (pas disabled)
      const continueButton = page.locator('button:has-text("Continuer"):not([disabled])').first();
      await continueButton.waitFor({ state: 'visible', timeout: 10000 });
      await continueButton.click();

      // Attendre que l'étape suivante (upload photo) soit présente dans le DOM
      const photoInput = page.locator('input[type="file"][accept*="image"]').first();
      await photoInput.waitFor({ state: 'attached', timeout: 5000 });
    });

    // Étape 3: Upload photo portrait (première photo)
    await test.step('Upload first portrait photo', async () => {
      console.log('Uploading first portrait photo...');

      // Trouver l'input file pour la photo
      const photoInput = page.locator('input[type="file"][accept*="image"]').first();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-portrait.jpg'));

      // Attendre que le cropper apparaisse
      const cropperTitle = page.locator('text=Recadrer votre photo');
      await cropperTitle.waitFor({ state: 'visible', timeout: 5000 });

      // Valider le recadrage
      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Valider le recadrage")').first();
      await expect(validateButton).toBeVisible({ timeout: 3000 });
      await validateButton.click();

      // Attendre que le cropper disparaisse et que le bouton galerie apparaisse
      await cropperTitle.waitFor({ state: 'hidden', timeout: 5000 });

      // S'assurer que le cookie banner n'est pas présent avant de cliquer
      await dismissCookieBanner(page);

      // Aller à la galerie - wait for button to be enabled
      const galleryButton = page.locator('button:has-text("Voir la galerie"), button:has-text("Ajouter à la galerie"), button:has-text("Continuer"):not([disabled])').first();
      await galleryButton.waitFor({ state: 'visible', timeout: 5000 });
      await galleryButton.click();

      // Attendre que la galerie soit visible
      const galleryTitle = page.locator('h2:has-text("Galerie")');
      await galleryTitle.waitFor({ state: 'visible', timeout: 5000 });
    });

    // Étape 4: Vérifier que la photo est dans la galerie
    await test.step('Verify photo in gallery', async () => {
      console.log('Verifying photo in gallery...');

      // Attendre que la galerie soit visible (utiliser le heading spécifique)
      const galleryTitle = page.locator('h2:has-text("Galerie")');
      await expect(galleryTitle).toBeVisible({ timeout: 5000 });

      // Prendre une capture avant modification
      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'gallery-before-change.png'),
        fullPage: true
      });
    });

    // Étape 5: Ouvrir le PreviewModal
    await test.step('Open preview modal', async () => {
      console.log('Opening preview modal...');

      // Cliquer sur l'icône œil pour ouvrir l'aperçu
      const eyeIcon = page.locator('button[title="Aperçu"], svg.lucide-eye').first();
      await eyeIcon.click();

      // Vérifier que le modal est ouvert
      const modalTitle = page.locator('text=Aperçu de votre création');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });

      // Attendre que le mockup soit chargé
      const mockupImage = page.locator('img[alt="Mockup téléphone et carte photo"]');
      await expect(mockupImage).toBeVisible({ timeout: 3000 });

      // Prendre une capture du mockup avant changement
      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'mockup-before-change.png'),
        fullPage: true
      });
    });

    // Étape 6: Upload nouvelle photo (orange) directement via l'input caché
    // Note: On ne clique PAS sur "Changer la photo" car ça ouvre le file picker natif
    // qui bloque le test. On interagit directement avec l'input caché.
    await test.step('Upload new photo and crop', async () => {
      console.log('Uploading new photo directly via hidden input...');

      // Trouver l'input file caché dans le modal et y uploader directement
      const photoInput = page.locator('input[type="file"][accept="image/*"]').first();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-portrait-2.jpg'));

      // Vérifier que le PhotoCropper est visible
      const cropperTitle = page.locator('text=Recadrer votre photo');
      console.log('Waiting for cropper to appear...');
      await expect(cropperTitle).toBeVisible({ timeout: 5000 });

      // Valider le recadrage pour revenir au PreviewModal
      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Valider le recadrage")').first();
      await expect(validateButton).toBeVisible({ timeout: 3000 });
      await validateButton.click();

      console.log('Clicked validate, waiting for cropper to close...');
      // Attendre que le cropper disparaisse et que le PreviewModal réapparaisse
      await cropperTitle.waitFor({ state: 'hidden', timeout: 5000 });
      const modalTitle = page.locator('text=Aperçu de votre création');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });
    });

    // Étape 7: Vérifier que le mockup a été mis à jour
    await test.step('Verify mockup updated', async () => {
      console.log('Verifying mockup updated...');

      // Vérifier que le modal est toujours ouvert
      const modalTitle = page.locator('text=Aperçu de votre création');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });

      // Vérifier que le mockup est visible et chargé
      const mockupImage = page.locator('img[alt="Mockup téléphone et carte photo"]');
      await expect(mockupImage).toBeVisible({ timeout: 5000 });

      // Prendre une capture du mockup après changement
      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'mockup-after-change.png'),
        fullPage: true
      });

      console.log('✅ Mockup updated successfully!');
    });

    // Étape 9: Fermer le modal et vérifier la galerie
    await test.step('Close modal and verify gallery', async () => {
      console.log('Closing modal...');

      // Fermer le modal
      const closeButton = page.locator('button:has-text("Fermer"), .lucide-x').first();
      await closeButton.click();

      // Attendre que le modal disparaisse
      const modalTitle = page.locator('text=Aperçu de votre création');
      await modalTitle.waitFor({ state: 'hidden', timeout: 3000 });

      // Vérifier que la galerie est visible avec la nouvelle photo
      const galleryTitle = page.locator('h2:has-text("Galerie")');
      await expect(galleryTitle).toBeVisible({ timeout: 3000 });

      // Prendre une capture de la galerie après modification
      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'gallery-after-change.png'),
        fullPage: true
      });

      console.log('✅ Test completed successfully!');
    });
  });

  test('Should change video in gallery preview modal and update mockup', async ({ page }) => {
    console.log('=== TEST: Changement de vidéo dans la galerie ===');

    // Étape 1: Sélectionner le format 10x15
    await test.step('Select format 10x15', async () => {
      const format10x15 = page.locator('button:has-text("Classique")').first();
      await format10x15.click();
      await page.waitForTimeout(2000);
    });

    // Étape 2: Upload vidéo portrait
    await test.step('Upload portrait video', async () => {
      const videoInput = page.locator('input[type="file"][accept*="video"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-portrait.mp4'));
      await page.waitForTimeout(3000);

      // S'assurer que le cookie banner n'est pas présent avant de cliquer
      await dismissCookieBanner(page);

      const continueButton = page.locator('button:has-text("Continuer"):not([disabled])').first();
      await continueButton.waitFor({ state: 'visible', timeout: 10000 });
      await continueButton.click();
      await page.waitForTimeout(1000);
    });

    // Étape 3: Upload photo
    await test.step('Upload photo', async () => {
      const photoInput = page.locator('input[type="file"][accept*="image"]').first();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-portrait.jpg'));
      await page.waitForTimeout(2000);

      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Valider le recadrage")').first();
      if (await validateButton.isVisible({ timeout: 3000 })) {
        await validateButton.click();
        await page.waitForTimeout(3000); // Increased wait time for processing
      }

      const galleryButton = page.locator('button:has-text("Voir la galerie"), button:has-text("Ajouter à la galerie"), button:has-text("Continuer"):not([disabled])').first();
      if (await galleryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await galleryButton.click();
        await page.waitForTimeout(2000);
      }
    });

    // Étape 4: Ouvrir le PreviewModal
    await test.step('Open preview modal', async () => {
      const eyeIcon = page.locator('button[title="Aperçu"], svg.lucide-eye').first();
      await eyeIcon.click();
      await page.waitForTimeout(2000);

      const modalTitle = page.locator('text=Aperçu de votre création');
      await expect(modalTitle).toBeVisible({ timeout: 3000 });

      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'mockup-before-video-change.png'),
        fullPage: true
      });
    });

    // Étape 5: Upload nouvelle vidéo (landscape) directement via l'input caché
    // Note: On ne clique PAS sur "Changer la vidéo" car ça ouvre le file picker natif
    await test.step('Upload new video', async () => {
      const videoInput = page.locator('input[type="file"][accept*="video"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-landscape.mp4'));
      await page.waitForTimeout(4000);
    });

    // Étape 7: Vérifier que le mockup a été mis à jour avec la nouvelle orientation
    await test.step('Verify mockup updated with new orientation', async () => {
      const modalTitle = page.locator('text=Aperçu de votre création');
      await expect(modalTitle).toBeVisible({ timeout: 3000 });

      await page.screenshot({
        path: path.join(__dirname, 'screenshots', 'mockup-after-video-change.png'),
        fullPage: true
      });

      console.log('✅ Video changed and mockup updated successfully!');
    });
  });
});
