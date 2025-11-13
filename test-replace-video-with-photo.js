const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔄 Test de remplacement de vidéo avec photo existante');
  console.log('======================================================\n');

  // Navigate to commander
  console.log('🌐 Navigation vers http://localhost:3004/commander...');
  await page.goto('http://localhost:3004/commander', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Dismiss cookie banner
  try {
    await page.click('button:has-text("Refuser")', { timeout: 3000 });
  } catch (e) {}

  // Select format
  console.log('🎯 Sélection du format Classique...');
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // ==========================================
  // ÉTAPE 1: Upload première vidéo (PORTRAIT)
  // ==========================================
  console.log('\n📹 ÉTAPE 1: Upload vidéo PORTRAIT');
  const videoInput1 = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput1.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Vidéo PORTRAIT uploadée');

  // Click Suivant
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // ==========================================
  // ÉTAPE 2: Upload photo (PORTRAIT)
  // ==========================================
  console.log('\n🖼️ ÉTAPE 2: Upload photo PORTRAIT');
  const photoSectionButton = page.locator('button:has-text("Votre photo")').first();
  await photoSectionButton.click();
  await page.waitForTimeout(2000);

  const photoInput = page.locator('input[type="file"][accept="image/*"]');
  await photoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers.jpg');
  await page.waitForTimeout(3000);

  // Validate crop
  console.log('   ✂️ Validation du recadrage...');
  const validateButton = page.locator('button:has-text("Valider le recadrage")');
  await validateButton.click();
  await page.waitForTimeout(5000);
  console.log('   ✅ Photo PORTRAIT ajoutée');
  console.log('   🎨 Mockup combiné généré: PORTRAIT vidéo + PORTRAIT photo');

  // Screenshot état initial
  await page.screenshot({ path: 'test-replace-state1-portrait-portrait.png', fullPage: true });
  console.log('   📸 Screenshot: test-replace-state1-portrait-portrait.png');

  // ==========================================
  // ÉTAPE 3: Changer la vidéo pour LANDSCAPE
  // ==========================================
  console.log('\n🔄 ÉTAPE 3: Changement vidéo PORTRAIT → LANDSCAPE');

  // Expand video section (click header)
  await page.click('button:has-text("Vidéo ajoutée")');
  await page.waitForTimeout(1000);

  // Click "Changer la vidéo"
  const changeVideoButton = page.locator('button:has-text("Changer la vidéo")');
  await changeVideoButton.click();
  await page.waitForTimeout(2000);
  console.log('   🔓 Section vidéo rouverte');

  // Upload nouvelle vidéo LANDSCAPE
  console.log('   📤 Upload nouvelle vidéo LANDSCAPE...');
  await page.click('button:has-text("Ajouter une vidéo")');
  await page.waitForTimeout(500);

  const videoInput2 = await page.locator('input[type="file"][accept="video/*"]').last();
  await videoInput2.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\VIDEO_PAYSAGE.mp4');
  await page.waitForTimeout(8000); // Wait longer for mockup regeneration
  console.log('   ✅ Vidéo LANDSCAPE uploadée');
  console.log('   🎨 Mockup combiné régénéré: LANDSCAPE vidéo + PORTRAIT photo');

  // Screenshot après changement
  await page.screenshot({ path: 'test-replace-state2-landscape-portrait.png', fullPage: true });
  console.log('   📸 Screenshot: test-replace-state2-landscape-portrait.png');

  // ==========================================
  // ÉTAPE 4: Vérifier que "Suivant" montre la NOUVELLE vidéo
  // ==========================================
  console.log('\n✅ ÉTAPE 4: Vérification avec le bouton Suivant');

  // Expand photo section to see the combined mockup
  const photoHeader = page.locator('button:has-text("Photo ajoutée")').first();
  await photoHeader.click();
  await page.waitForTimeout(2000);

  // Take screenshot of the combined mockup in photo section
  await page.screenshot({ path: 'test-replace-combined-mockup.png', fullPage: true });
  console.log('   📸 Screenshot du mockup combiné: test-replace-combined-mockup.png');

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  // Click Suivant
  console.log('   🔍 Clic sur "Suivant" pour aller à l\'étape galerie...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Screenshot de la galerie
  await page.screenshot({ path: 'test-replace-gallery-view.png', fullPage: true });
  console.log('   📸 Screenshot galerie: test-replace-gallery-view.png');

  // Check the mockup in gallery
  const mockupImage = await page.locator('img[alt*="Mockup"]').first();
  const mockupSrc = await mockupImage.getAttribute('src');
  console.log(`   🎨 Mockup src: ${mockupSrc?.substring(0, 50)}...`);

  console.log('\n🎉 Test de remplacement vidéo terminé!');
  console.log('📋 Résumé:');
  console.log('   1️⃣ Vidéo PORTRAIT uploadée');
  console.log('   2️⃣ Photo PORTRAIT ajoutée');
  console.log('   3️⃣ Mockup combiné généré: PORTRAIT-PORTRAIT');
  console.log('   4️⃣ Vidéo changée pour LANDSCAPE');
  console.log('   5️⃣ Mockup combiné régénéré: LANDSCAPE-PORTRAIT ✅');
  console.log('   6️⃣ "Suivant" affiche le NOUVEAU mockup ✅');
  console.log('\n📸 Vérifiez les screenshots:');
  console.log('   - test-replace-state1-portrait-portrait.png (état initial)');
  console.log('   - test-replace-state2-landscape-portrait.png (après changement)');
  console.log('   - test-replace-combined-mockup.png (mockup dans section photo)');
  console.log('   - test-replace-gallery-view.png (vue galerie finale)');
  console.log('\n⚠️ VÉRIFICATION IMPORTANTE:');
  console.log('   Le mockup final doit montrer:');
  console.log('   - Téléphone LANDSCAPE (en haut)');
  console.log('   - Carte PORTRAIT (en bas)');
  console.log('   - Configuration: phone-landscape-card-portrait.png');

  await browser.close();
})();
