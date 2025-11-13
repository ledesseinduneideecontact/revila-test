const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📱 Navigating to http://localhost:3004/commander...');
  await page.goto('http://localhost:3004/commander', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Dismiss cookie banner if present
  try {
    await page.click('button:has-text("Refuser")', { timeout: 3000 });
    console.log('🍪 Cookie banner dismissed');
  } catch (e) {
    console.log('🍪 No cookie banner found');
  }

  // Step 1: Click "Classique" format
  console.log('🎯 Clicking on Classique format...');
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // Step 2: Upload video
  console.log('📹 Uploading video...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);
  console.log('✅ Video uploaded successfully');

  // Step 3: Click "Suivant" to go to Step 2
  console.log('➡️ Clicking Suivant to go to Step 2...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Step 4: Verify photo section exists and expand if needed
  console.log('📂 Checking photo section...');
  const photoSectionButton = page.locator('button:has-text("Votre photo")').first();
  await photoSectionButton.waitFor({ state: 'visible', timeout: 5000 });

  // Click to expand photo section
  await photoSectionButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Photo section expanded');

  // Step 5: Wait for the upload button to be visible
  console.log('🔍 Waiting for upload button...');
  const uploadButton = page.locator('button:has-text("Choisir une photo")');
  await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✅ Upload button found');

  // Step 6: Upload photo via file input
  console.log('🖼️ Uploading photo...');
  // Get the file input directly
  const photoInput = page.locator('input[type="file"][accept="image/*"]');
  await photoInput.waitFor({ state: 'attached', timeout: 5000 });
  await photoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers-paysage.jpg');
  await page.waitForTimeout(3000);
  console.log('✅ Photo uploaded successfully');

  // Step 7: Wait for image cropper to appear and validate
  console.log('✂️ Waiting for image cropper...');
  const validateButton = page.locator('button:has-text("Valider le recadrage")');
  await validateButton.waitFor({ state: 'visible', timeout: 10000 });
  await validateButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Crop validated');

  // Step 8: Wait for combined mockup generation
  console.log('⏳ Waiting for combined mockup generation...');
  await page.waitForTimeout(8000);

  // Step 9: Take screenshot of Step 2 with combined mockup
  await page.screenshot({ path: 'step2-combined-final.png', fullPage: true });
  console.log('📸 Step 2 screenshot saved (combined mockup with rounded corners)');

  // Step 10: Verify mockup is visible
  const mockupImages = await page.locator('img[alt*="Mockup"]').count();
  console.log('🖼️ Number of mockup images found:', mockupImages, mockupImages > 0 ? '✅' : '❌');

  console.log('\n🎉 Test completed successfully!');
  console.log('📋 Screenshot saved: step2-combined-final.png');
  console.log('👀 Please check the screenshot to verify rounded corners on:');
  console.log('   - Phone zone (video) - should have ~19px radius for portrait');
  console.log('   - Card zone (photo) - should have 15px radius');

  await browser.close();
})();
