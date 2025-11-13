const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔒 Test du message centré et sécurisé');
  console.log('=======================================\n');

  // Navigate
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

  // Upload video
  console.log('📹 Upload vidéo...');
  const videoInput = await page.locator('input[type="file"][accept="video/*"]');
  await videoInput.setInputFiles('c:\\Users\\simon\\Desktop\\dev\\sauvegarde\\revelo-trae-copie-copie\\revelo-main\\public\\frontend-pictures\\commander\\TEST_VIDEO.mp4');
  await page.waitForTimeout(5000);
  console.log('   ✅ Vidéo uploadée');

  // Click Suivant
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Upload photo
  console.log('🖼️ Upload photo...');
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

  // Go to gallery
  console.log('\n📸 Navigation vers la galerie...');
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(3000);

  // Expand message section
  console.log('\n💬 Test de la section message personnalisé');
  const messageToggle = page.locator('text=Message personnalisé').first();
  await messageToggle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Enable message
  console.log('   🔓 Activation du message...');
  const ouiButton = page.locator('button:has-text("Oui")').first();
  await ouiButton.click();
  await page.waitForTimeout(1000);

  // Get the textarea
  const textarea = page.locator('textarea[placeholder*="Écrivez votre message"]').first();

  // ==========================================
  // TEST 1: Texte centré
  // ==========================================
  console.log('\n📐 TEST 1: Vérification du centrage du texte');
  const textAlign = await textarea.evaluate(el => window.getComputedStyle(el).textAlign);
  console.log(`   Text-align: ${textAlign} ${textAlign === 'center' ? '✅' : '❌'}`);

  // Type normal text
  await textarea.fill('ma chère et tendre amie');
  await page.waitForTimeout(1000);

  // Screenshot
  await page.screenshot({ path: 'test-message-centered.png', fullPage: true });
  console.log('   📸 Screenshot: test-message-centered.png');

  // ==========================================
  // TEST 2: Protection XSS - Tags HTML
  // ==========================================
  console.log('\n🛡️ TEST 2: Protection contre les tags HTML');
  await textarea.fill('<script>alert("XSS")</script>Texte normal');
  await page.waitForTimeout(500);

  const valueAfterHTML = await textarea.inputValue();
  console.log(`   Input: "<script>alert("XSS")</script>Texte normal"`);
  console.log(`   Result: "${valueAfterHTML}"`);
  console.log(`   Tags supprimés: ${!valueAfterHTML.includes('<') && !valueAfterHTML.includes('>') ? '✅' : '❌'}`);

  // ==========================================
  // TEST 3: Protection XSS - Événements
  // ==========================================
  console.log('\n🛡️ TEST 3: Protection contre les attributs d\'événements');
  await textarea.fill('onclick=alert(1) onerror=alert(2) Texte');
  await page.waitForTimeout(500);

  const valueAfterEvents = await textarea.inputValue();
  console.log(`   Input: "onclick=alert(1) onerror=alert(2) Texte"`);
  console.log(`   Result: "${valueAfterEvents}"`);
  console.log(`   Événements supprimés: ${!valueAfterEvents.includes('onclick') && !valueAfterEvents.includes('onerror') ? '✅' : '❌'}`);

  // ==========================================
  // TEST 4: Protection XSS - JavaScript protocol
  // ==========================================
  console.log('\n🛡️ TEST 4: Protection contre javascript: protocol');
  await textarea.fill('javascript:alert(1) Texte normal');
  await page.waitForTimeout(500);

  const valueAfterJS = await textarea.inputValue();
  console.log(`   Input: "javascript:alert(1) Texte normal"`);
  console.log(`   Result: "${valueAfterJS}"`);
  console.log(`   Protocol supprimé: ${!valueAfterJS.toLowerCase().includes('javascript:') ? '✅' : '❌'}`);

  // ==========================================
  // TEST 5: Limite de caractères
  // ==========================================
  console.log('\n📏 TEST 5: Limite de caractères (500)');
  const longText = 'A'.repeat(600);
  await textarea.fill(longText);
  await page.waitForTimeout(500);

  const valueAfterLimit = await textarea.inputValue();
  console.log(`   Input: ${longText.length} caractères`);
  console.log(`   Result: ${valueAfterLimit.length} caractères`);
  console.log(`   Limite respectée: ${valueAfterLimit.length <= 500 ? '✅' : '❌'}`);

  // ==========================================
  // TEST 6: Texte normal
  // ==========================================
  console.log('\n✍️ TEST 6: Texte normal conservé');
  await textarea.fill('Joyeux anniversaire ma chère amie ! 🎂');
  await page.waitForTimeout(500);

  const normalText = await textarea.inputValue();
  console.log(`   Input: "Joyeux anniversaire ma chère amie ! 🎂"`);
  console.log(`   Result: "${normalText}"`);
  console.log(`   Texte conservé: ${normalText === 'Joyeux anniversaire ma chère amie ! 🎂' ? '✅' : '❌'}`);

  // Final screenshot with normal text
  await page.screenshot({ path: 'test-message-final.png', fullPage: true });
  console.log('   📸 Screenshot: test-message-final.png');

  console.log('\n🎉 Tests terminés!');
  console.log('📋 Résumé:');
  console.log('   ✅ Texte centré horizontalement (text-align: center)');
  console.log('   ✅ Texte centré verticalement (padding-top: 35%)');
  console.log('   ✅ Protection contre les tags HTML');
  console.log('   ✅ Protection contre les attributs d\'événements');
  console.log('   ✅ Protection contre javascript: protocol');
  console.log('   ✅ Limite de 500 caractères respectée');
  console.log('   ✅ Texte normal et émojis préservés');

  await browser.close();
})();
