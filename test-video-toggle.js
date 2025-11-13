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

  // Step 2: Verify video section is expanded (before upload)
  console.log('✅ Verifying video section is expanded at Step 1 (before upload)...');
  const uploadButtonVisible = await page.locator('button:has-text("Ajouter une vidéo")').first().isVisible();
  console.log('   Upload button visible:', uploadButtonVisible ? '✅ YES' : '❌ NO');

  // Step 3: Check for chevron icon (should be ChevronUp when expanded)
  const chevronUp = await page.locator('svg.lucide-chevron-up').count();
  console.log('   ChevronUp icon count:', chevronUp, chevronUp > 0 ? '✅ (expanded)' : '❌');

  // Step 4: Upload video
  console.log('📹 Uploading video...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);

  // Step 5: Verify video section auto-collapsed after upload
  console.log('✅ Verifying video section auto-collapsed after upload...');
  const chevronDown = await page.locator('svg.lucide-chevron-down').count();
  console.log('   ChevronDown icon count:', chevronDown, chevronDown > 0 ? '✅ (collapsed)' : '❌');

  // Step 6: Check for green checkmark
  const checkIcon = await page.locator('svg.lucide-check').count();
  console.log('   Green checkmark count:', checkIcon, checkIcon > 0 ? '✅ (video uploaded)' : '❌');

  // Step 7: Verify upload interface is hidden (collapsed)
  const changeButtonVisible = await page.locator('button:has-text("Changer la vidéo")').first().isVisible();
  console.log('   "Changer la vidéo" button visible:', changeButtonVisible ? '❌ Should be hidden' : '✅ Hidden (collapsed)');

  // Step 8: Click toggle to expand
  console.log('🔄 Clicking video toggle to expand...');
  await page.locator('button:has-text("Vidéo ajoutée")').first().click();
  await page.waitForTimeout(1000);

  // Step 9: Verify section is now expanded
  const changeButtonVisibleAfterToggle = await page.locator('button:has-text("Changer la vidéo")').first().isVisible();
  console.log('   "Changer la vidéo" button visible after toggle:', changeButtonVisibleAfterToggle ? '✅ YES' : '❌ NO');

  // Step 10: Click toggle again to collapse
  console.log('🔄 Clicking video toggle to collapse again...');
  await page.locator('button:has-text("Vidéo ajoutée")').first().click();
  await page.waitForTimeout(1000);

  const changeButtonHidden = await page.locator('button:has-text("Changer la vidéo")').first().isVisible();
  console.log('   "Changer la vidéo" button hidden after collapse:', changeButtonHidden ? '❌ Still visible' : '✅ Hidden');

  // Step 11: Navigate to Step 2
  console.log('➡️ Clicking Suivant to go to Step 2...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Step 12: Take screenshot of Step 2
  await page.screenshot({ path: 'step2-with-video-toggle.png', fullPage: true });
  console.log('📸 Step 2 screenshot saved');

  // Step 13: Get all h3 titles at Step 2
  const h3Elements = await page.locator('h3').allTextContents();
  console.log('📝 All h3 titles at Step 2:', h3Elements);

  // Step 14: Verify video section exists and is collapsed at Step 2
  console.log('✅ Verifying video section at Step 2...');
  const videoTitleStep2 = h3Elements.find(text => text.includes('Vidéo ajoutée'));
  console.log('   Video section title:', videoTitleStep2 ? `✅ "${videoTitleStep2}"` : '❌ NOT FOUND');

  // Step 15: Check for green checkmark at Step 2
  const checkIconStep2 = await page.locator('svg.lucide-check').count();
  console.log('   Green checkmark at Step 2:', checkIconStep2, checkIconStep2 > 0 ? '✅ (present)' : '❌');

  // Step 16: Verify video section is collapsed at Step 2
  const chevronDownStep2 = await page.locator('svg.lucide-chevron-down').count();
  console.log('   ChevronDown icon at Step 2:', chevronDownStep2, chevronDownStep2 > 0 ? '✅ (collapsed)' : '❌');

  // Step 17: Verify photo section exists
  const photoTitle = h3Elements.find(text => text.includes('Votre photo'));
  console.log('   Photo section title:', photoTitle ? `✅ "${photoTitle}"` : '❌ NOT FOUND');

  // Step 18: Verify order (video section should come BEFORE photo section)
  const videoIndex = h3Elements.findIndex(text => text.includes('Vidéo ajoutée'));
  const photoIndex = h3Elements.findIndex(text => text.includes('Votre photo'));
  console.log('   Section order:', videoIndex < photoIndex ? '✅ Video before Photo' : '❌ Wrong order');

  // Step 19: Click video toggle at Step 2 to expand
  console.log('🔄 Clicking video toggle at Step 2 to expand...');
  await page.locator('button:has-text("Vidéo ajoutée")').first().click();
  await page.waitForTimeout(1000);

  // Step 20: Verify "Changer la vidéo" button is now visible
  const changeButtonStep2 = await page.locator('button:has-text("Changer la vidéo")').first().isVisible();
  console.log('   "Changer la vidéo" button visible at Step 2:', changeButtonStep2 ? '✅ YES' : '❌ NO');

  // Step 21: Take final screenshot
  await page.screenshot({ path: 'step2-video-expanded.png', fullPage: true });
  console.log('📸 Step 2 (expanded) screenshot saved');

  console.log('\n🎉 Test completed successfully!');
  await browser.close();
})();
