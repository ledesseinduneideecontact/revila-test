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
  } catch (e) {
    // ignore
  }

  // Click "Classique" format
  console.log('🎯 Clicking Classique...');
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // Upload video
  console.log('📹 Uploading video...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);

  // Go to Step 2
  console.log('➡️ Going to Step 2...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Take screenshot BEFORE expanding photo section
  await page.screenshot({ path: 'diagnostic-before-expand.png', fullPage: true });
  console.log('📸 Screenshot before expand saved');

  // Check if photo section is collapsed
  const chevronDown = await page.locator('svg.lucide-chevron-down').count();
  console.log('ChevronDown icons (collapsed sections):', chevronDown);

  // Expand photo section
  console.log('📂 Expanding photo section...');
  const photoButton = page.locator('button:has-text("Votre photo")').first();
  await photoButton.click();
  await page.waitForTimeout(3000);

  // Take screenshot AFTER expanding
  await page.screenshot({ path: 'diagnostic-after-expand.png', fullPage: true });
  console.log('📸 Screenshot after expand saved');

  // Check what buttons are visible
  const allButtons = await page.locator('button').allTextContents();
  console.log('\n📝 All visible buttons:', allButtons);

  // Check for input fields
  const allInputs = await page.locator('input[type="file"]').count();
  console.log('📝 Number of file inputs:', allInputs);

  // Check if upload button exists (even if not visible)
  const uploadButtonExists = await page.locator('button:has-text("Choisir une photo")').count();
  console.log('📝 "Choisir une photo" button count:', uploadButtonExists);

  // Check the HTML of photo section
  const photoSection = page.locator('div.bg-white.rounded-xl.shadow-lg').filter({ hasText: 'Votre photo' });
  const photoHTML = await photoSection.innerHTML();
  console.log('\n📦 Photo section HTML (first 1000 chars):\n', photoHTML.substring(0, 1000));

  console.log('\n✅ Diagnostic complete! Check the screenshots:');
  console.log('   - diagnostic-before-expand.png');
  console.log('   - diagnostic-after-expand.png');

  await browser.close();
})();
