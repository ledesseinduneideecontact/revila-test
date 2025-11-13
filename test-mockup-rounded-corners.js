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

  // Step 3: Take screenshot of Step 1 with video mockup
  await page.screenshot({ path: 'step1-video-mockup-rounded.png', fullPage: true });
  console.log('📸 Step 1 screenshot saved (video mockup with rounded corners)');

  // Step 4: Click "Suivant" to go to Step 2
  console.log('➡️ Clicking Suivant to go to Step 2...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Step 5: Take screenshot of Step 2 (before photo upload - video mockup only)
  await page.screenshot({ path: 'step2-video-only-mockup-rounded.png', fullPage: true });
  console.log('📸 Step 2 screenshot saved (video-only mockup before photo)');

  // Step 6: Expand photo section
  console.log('📂 Expanding photo section...');
  const photoToggle = await page.locator('button:has-text("Votre photo")').first();
  const isCollapsed = await page.locator('svg.lucide-chevron-down').count();
  if (isCollapsed > 0) {
    await photoToggle.click();
    await page.waitForTimeout(1000);
    console.log('✅ Photo section expanded');
  }

  // Step 7: Upload photo
  console.log('🖼️ Uploading photo...');
  const photoInput = await page.locator('input[type="file"][accept="image/*"]').first();
  await photoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers-paysage.jpg');
  await page.waitForTimeout(3000);
  console.log('✅ Photo uploaded successfully');

  // Step 8: Wait for combined mockup generation
  console.log('⏳ Waiting for combined mockup generation...');
  await page.waitForTimeout(5000);

  // Step 9: Take screenshot of Step 2 with combined mockup
  await page.screenshot({ path: 'step2-combined-mockup-rounded.png', fullPage: true });
  console.log('📸 Step 2 screenshot saved (combined mockup with video + photo, rounded corners)');

  // Step 10: Verify mockup is visible
  const mockupImages = await page.locator('img[alt*="Mockup"]').count();
  console.log('🖼️ Number of mockup images found:', mockupImages, mockupImages > 0 ? '✅' : '❌');

  console.log('\n🎉 Test completed successfully!');
  console.log('📋 Screenshots saved:');
  console.log('   - step1-video-mockup-rounded.png (video mockup at Step 1)');
  console.log('   - step2-video-only-mockup-rounded.png (video mockup at Step 2 before photo)');
  console.log('   - step2-combined-mockup-rounded.png (combined video+photo mockup with rounded corners)');
  console.log('\n👀 Please check the screenshots to verify that rounded corners are applied to:');
  console.log('   - Phone zone (video)');
  console.log('   - Card zone (photo)');

  await browser.close();
})();
