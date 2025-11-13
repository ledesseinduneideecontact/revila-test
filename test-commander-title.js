const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📱 Navigating to http://localhost:3004/commander...');
  await page.goto('http://localhost:3004/commander', { waitUntil: 'networkidle' });

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Take screenshot of format selection
  await page.screenshot({ path: 'commander-format.png', fullPage: true });
  console.log('📸 Format selection screenshot saved');

  // Click on "Classique" format
  console.log('🎯 Clicking on Classique format...');
  await page.click('text=Classique');
  await page.waitForTimeout(3000);

  // Take screenshot of upload page
  await page.screenshot({ path: 'commander-upload.png', fullPage: true });
  console.log('📸 Upload page screenshot saved');

  // Check for the title
  const h3Elements = await page.locator('h3').allTextContents();
  console.log('📝 All h3 titles found:', h3Elements);

  // Check if toggle chevron is present
  const chevronCount = await page.locator('svg.lucide-chevron-down').count();
  console.log('🔽 Chevron toggle count:', chevronCount, '(should be 0)');

  // Check for "Ajouter votre vidéo" or "Vidéo ajoutée"
  const videoTitle = h3Elements.find(text => text.includes('Ajouter votre vidéo') || text.includes('Vidéo ajoutée'));
  console.log('✅ Video section title:', videoTitle);

  await browser.close();
})();
