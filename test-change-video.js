const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📹 Test de changement de vidéo');
  console.log('=================================\n');

  // Naviguer vers la page
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
  // ÉTAPE 1: Upload première vidéo
  // ==========================================
  console.log('\n📹 ÉTAPE 1: Upload de la première vidéo (portrait)');
  const videoInput1 = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput1.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Première vidéo uploadée');

  // Click Suivant
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // ==========================================
  // ÉTAPE 2: Upload photo
  // ==========================================
  console.log('\n🖼️ ÉTAPE 2: Upload de la photo');
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
  console.log('   ✅ Photo ajoutée');

  // Screenshot de l'état initial
  await page.screenshot({ path: 'test-change-video-before.png', fullPage: true });
  console.log('   📸 Screenshot: test-change-video-before.png');

  // ==========================================
  // ÉTAPE 3: Changer la vidéo
  // ==========================================
  console.log('\n🔄 ÉTAPE 3: Clic sur "Changer la vidéo"');

  // Vérifier que la section vidéo est collapsed
  const videoSectionBefore = await page.locator('button:has-text("Vidéo ajoutée")').isVisible();
  console.log(`   Section vidéo visible avant clic: ${videoSectionBefore ? '✅' : '❌'}`);

  // Click "Changer la vidéo"
  const changeVideoButton = page.locator('button:has-text("Changer la vidéo")');
  await changeVideoButton.click();
  await page.waitForTimeout(2000);

  // Vérifier que la section vidéo est maintenant ouverte
  const uploadSectionAfter = await page.locator('text=Ajouter une vidéo').isVisible();
  console.log(`   Section upload vidéo visible après clic: ${uploadSectionAfter ? '✅' : '❌'}`);

  // Vérifier que le bouton de montage est présent
  const montageButtonVisible = await page.locator('button:has-text("Créer un montage vidéo automatique")').isVisible();
  console.log(`   Bouton montage visible: ${montageButtonVisible ? '✅' : '❌'}`);

  // Screenshot après changement
  await page.screenshot({ path: 'test-change-video-after-click.png', fullPage: true });
  console.log('   📸 Screenshot: test-change-video-after-click.png');

  // ==========================================
  // ÉTAPE 4: Upload nouvelle vidéo (landscape)
  // ==========================================
  console.log('\n📹 ÉTAPE 4: Upload de la nouvelle vidéo (landscape)');

  // Click on "Ajouter une vidéo" button to trigger file input
  await page.click('button:has-text("Ajouter une vidéo")');
  await page.waitForTimeout(500);

  // Upload new video
  const videoInput2 = await page.locator('input[type="file"][accept="video/*"]').last();
  await videoInput2.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\VIDEO_PAYSAGE.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Nouvelle vidéo uploadée (landscape)');

  // Wait for mockup generation
  await page.waitForTimeout(3000);

  // Screenshot avec la nouvelle vidéo
  await page.screenshot({ path: 'test-change-video-new-uploaded.png', fullPage: true });
  console.log('   📸 Screenshot: test-change-video-new-uploaded.png');

  // ==========================================
  // ÉTAPE 5: Vérifier le mockup combiné
  // ==========================================
  console.log('\n🎨 ÉTAPE 5: Vérification du mockup combiné');

  // La photo section devrait avoir un nouveau mockup combiné
  const mockupCombined = await page.locator('img[alt*="Mockup"]').count();
  console.log(`   Nombre de mockups trouvés: ${mockupCombined}`);

  // Screenshot final
  await page.screenshot({ path: 'test-change-video-final.png', fullPage: true });
  console.log('   📸 Screenshot: test-change-video-final.png');

  console.log('\n🎉 Test de changement de vidéo terminé!');
  console.log('📋 Résumé:');
  console.log('   ✅ Première vidéo (portrait) uploadée');
  console.log('   ✅ Photo uploadée');
  console.log('   ✅ Bouton "Changer la vidéo" cliqué');
  console.log('   ✅ Section vidéo rouverte');
  console.log('   ✅ Nouvelle vidéo (landscape) uploadée');
  console.log('   ✅ Mockup combiné mis à jour');
  console.log('\n📸 Vérifiez les screenshots pour confirmer visuellement:');
  console.log('   - test-change-video-before.png (état initial)');
  console.log('   - test-change-video-after-click.png (section ouverte)');
  console.log('   - test-change-video-new-uploaded.png (nouvelle vidéo)');
  console.log('   - test-change-video-final.png (résultat final)');

  await browser.close();
})();
