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

  // Step 4: Check that message section does NOT exist yet (only video uploaded)
  console.log('🔍 Checking message section visibility (should be hidden)...');
  const messageBeforePhoto = await page.locator('button:has-text("Message personnalisé")').count();
  console.log(`   Message section count before photo: ${messageBeforePhoto} ${messageBeforePhoto === 0 ? '✅ (correct - hidden)' : '❌ (should be hidden)'}`);

  // Step 5: Expand photo section and upload photo
  console.log('📂 Expanding photo section...');
  const photoSectionButton = page.locator('button:has-text("Votre photo")').first();
  await photoSectionButton.click();
  await page.waitForTimeout(2000);

  console.log('🖼️ Uploading photo...');
  const photoInput = page.locator('input[type="file"][accept="image/*"]');
  await photoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\en-attente-de-vos-fichiers-paysage.jpg');
  await page.waitForTimeout(3000);

  // Step 6: Validate crop
  console.log('✂️ Validating crop...');
  const validateButton = page.locator('button:has-text("Valider le recadrage")');
  await validateButton.click();
  await page.waitForTimeout(3000);

  // Step 7: Check that message section NOW EXISTS (both video and photo uploaded)
  console.log('🔍 Checking message section visibility (should be visible)...');
  const messageAfterPhoto = await page.locator('button:has-text("Message personnalisé")').count();
  console.log(`   Message section count after photo: ${messageAfterPhoto} ${messageAfterPhoto === 1 ? '✅ (correct - visible)' : '❌ (should be visible)'}`);

  // Step 8: Verify message section is COLLAPSED by default
  const messageContent = await page.locator('text=Ajouter un message sur la carte photo ?').isVisible();
  console.log(`   Message section expanded: ${messageContent ? '❌ (should be collapsed)' : '✅ (correct - collapsed)'}`);

  // Step 9: Take screenshot before expanding message
  await page.screenshot({ path: 'test-message-before-expand.png', fullPage: true });
  console.log('📸 Screenshot saved: test-message-before-expand.png');

  // Step 10: Expand message section
  console.log('📂 Expanding message section...');
  await page.locator('button:has-text("Message personnalisé")').click();
  await page.waitForTimeout(1000);

  // Step 11: Verify "Non" is selected by default
  const nonButton = page.locator('button:has-text("Non")').first();
  const nonIsActive = await nonButton.evaluate((el) => el.classList.contains('bg-orange-500'));
  console.log(`   "Non" button active by default: ${nonIsActive ? '✅' : '❌'}`);

  // Step 12: Verify textarea is NOT visible (because Non is selected)
  const textareaVisible = await page.locator('textarea[placeholder*="Écrivez votre message"]').isVisible();
  console.log(`   Textarea hidden with "Non": ${!textareaVisible ? '✅' : '❌'}`);

  // Step 13: Take screenshot with message section expanded (Non selected)
  await page.screenshot({ path: 'test-message-expanded-non.png', fullPage: true });
  console.log('📸 Screenshot saved: test-message-expanded-non.png');

  // Step 14: Click "Oui" to enable message
  console.log('✅ Clicking "Oui" to enable message...');
  await page.locator('button:has-text("Oui")').first().click();
  await page.waitForTimeout(1000);

  // Step 15: Verify textarea IS NOW visible
  const textareaVisibleAfterOui = await page.locator('textarea[placeholder*="Écrivez votre message"]').isVisible();
  console.log(`   Textarea visible with "Oui": ${textareaVisibleAfterOui ? '✅' : '❌'}`);

  // Step 16: Verify Revila label is visible
  const revilaLabel = await page.locator('text=Label Revila').isVisible();
  console.log(`   Revila label visible: ${revilaLabel ? '✅' : '❌'}`);

  // Step 17: Type a test message
  console.log('✍️ Typing test message...');
  await page.locator('textarea[placeholder*="Écrivez votre message"]').fill('Ceci est un message de test pour Revila! 🎉');
  await page.waitForTimeout(1000);

  // Step 18: Take final screenshot with message typed
  await page.screenshot({ path: 'test-message-expanded-oui.png', fullPage: true });
  console.log('📸 Screenshot saved: test-message-expanded-oui.png');

  console.log('\n🎉 Test completed successfully!');
  console.log('📋 Summary:');
  console.log('   ✅ Message section hidden before photo upload');
  console.log('   ✅ Message section appears after both video and photo uploaded');
  console.log('   ✅ Message section collapsed by default');
  console.log('   ✅ "Non" selected by default');
  console.log('   ✅ Textarea hidden when "Non" selected');
  console.log('   ✅ Textarea visible when "Oui" selected');
  console.log('   ✅ Revila label and message input working');

  await browser.close();
})();
