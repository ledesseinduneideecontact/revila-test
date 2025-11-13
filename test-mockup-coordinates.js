const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📱 Test des coordonnées des mockups pour toutes les combinaisons');
  console.log('=================================================================\n');

  // Naviguer vers la page
  console.log('🌐 Navigation vers http://localhost:3004/commander...');
  await page.goto('http://localhost:3004/commander', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Dismiss cookie banner if present
  try {
    await page.click('button:has-text("Refuser")', { timeout: 3000 });
  } catch (e) {}

  // Click "Classique" format
  console.log('🎯 Sélection du format Classique...');
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // ==========================================
  // TEST 1: Vidéo PORTRAIT + Photo LANDSCAPE
  // ==========================================
  console.log('\n📹 TEST 1: Vidéo PORTRAIT + Photo LANDSCAPE');
  console.log('Expected mockup: phone-portrait-card-landscape.png');
  console.log('Expected PHONE_ZONE: { x: 72, y: 323, width: 394, height: 855 }');
  console.log('Expected CARD_ZONE: { x: 533, y: 441, width: 928, height: 618 }');

  // Upload portrait video
  console.log('   📤 Uploading portrait video...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Portrait video uploaded');

  // Click Suivant
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Expand photo section and upload landscape photo
  console.log('   📤 Uploading landscape photo...');
  const photoSectionButton = page.locator('button:has-text("Votre photo")').first();
  await photoSectionButton.click();
  await page.waitForTimeout(2000);

  const photoInput = page.locator('input[type="file"][accept="image/*"]');
  await photoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers-paysage.jpg');
  await page.waitForTimeout(3000);

  // Validate crop
  console.log('   ✂️ Validating crop...');
  const validateButton = page.locator('button:has-text("Valider le recadrage")');
  await validateButton.click();
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'test-portrait-video-landscape-photo.png', fullPage: true });
  console.log('   📸 Screenshot saved: test-portrait-video-landscape-photo.png');
  console.log('   ✅ TEST 1 completed - Please verify mockup visually\n');

  // Wait for user to inspect
  await page.waitForTimeout(3000);

  // ==========================================
  // TEST 2: Vidéo LANDSCAPE + Photo PORTRAIT
  // ==========================================
  console.log('\n📹 TEST 2: Vidéo LANDSCAPE + Photo PORTRAIT');
  console.log('Expected mockup: phone-landscape-card-portrait.png');
  console.log('Expected PHONE_ZONE: { x: 336, y: 90, width: 827, height: 381 }');
  console.log('Expected CARD_ZONE: { x: 451, y: 544, width: 598, height: 897 }');

  // Refresh page to start over
  console.log('   🔄 Refreshing page...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click format again
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // Upload landscape video
  console.log('   📤 Uploading landscape video...');
  const videoInput2 = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput2.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\VIDEO_PAYSAGE.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Landscape video uploaded');

  // Click Suivant
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Expand photo section and upload portrait photo
  console.log('   📤 Uploading portrait photo...');
  const photoSectionButton2 = page.locator('button:has-text("Votre photo")').first();
  await photoSectionButton2.click();
  await page.waitForTimeout(2000);

  const photoInput2 = page.locator('input[type="file"][accept="image/*"]');
  await photoInput2.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers.jpg');
  await page.waitForTimeout(3000);

  // Validate crop
  console.log('   ✂️ Validating crop...');
  const validateButton2 = page.locator('button:has-text("Valider le recadrage")');
  await validateButton2.click();
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'test-landscape-video-portrait-photo.png', fullPage: true });
  console.log('   📸 Screenshot saved: test-landscape-video-portrait-photo.png');
  console.log('   ✅ TEST 2 completed - Please verify mockup visually\n');

  console.log('\n🎉 All coordinate tests completed!');
  console.log('📋 Summary:');
  console.log('   ✅ Test 1: Portrait video + Landscape photo');
  console.log('   ✅ Test 2: Landscape video + Portrait photo');
  console.log('\n📸 Screenshots saved - Please verify visually that:');
  console.log('   - Video fits properly in phone zone');
  console.log('   - Photo fits properly in card zone');
  console.log('   - No overlapping or misalignment');
  console.log('   - Rounded corners are correct');

  await browser.close();
})();
