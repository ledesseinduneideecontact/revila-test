const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📱 Navigating to http://localhost:3004/commander...');
  await page.goto('http://localhost:3004/commander', { waitUntil: 'networkidle' });

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Click on "Classique" format
  console.log('🎯 Clicking on Classique format...');
  await page.click('text=Classique');
  await page.waitForTimeout(2000);

  // Upload a video file
  console.log('📹 Uploading video...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');

  // Wait for video to be processed
  await page.waitForTimeout(5000);

  // Click "Suivant" to go to Step 2
  console.log('➡️ Clicking Suivant to go to Step 2...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Take screenshot of Step 2
  await page.screenshot({ path: 'step2-current.png', fullPage: true });
  console.log('📸 Step 2 screenshot saved');

  // Check for any video section at Step 2
  const videoSections = await page.locator('div.bg-white.rounded-xl.shadow-lg.p-6').count();
  console.log('📦 Number of white card sections:', videoSections);

  // Get all h3 titles
  const h3Elements = await page.locator('h3').allTextContents();
  console.log('📝 All h3 titles at Step 2:', h3Elements);

  // Check if there's a "Vidéo ajoutée" or video-related section
  const hasVideoAdded = h3Elements.some(text => text.includes('Vidéo ajoutée') || text.includes('vidéo'));
  console.log('🎥 Has video section:', hasVideoAdded);

  // Get HTML of all sections
  const sections = await page.locator('div.bg-white.rounded-xl.shadow-lg.p-6').all();
  for (let i = 0; i < sections.length; i++) {
    const html = await sections[i].innerHTML();
    console.log(`\n📦 Section ${i + 1} HTML (first 500 chars):\n`, html.substring(0, 500));
  }

  await browser.close();
})();
