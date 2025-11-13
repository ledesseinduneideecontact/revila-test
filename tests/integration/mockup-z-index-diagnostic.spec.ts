import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

interface ElementInfo {
  tagName: string;
  classes: string;
  zIndex: string;
  position: string;
  src?: string;
  order: number;
}

test.describe('Mockup Z-Index Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page commander
    await page.goto('http://localhost:3004/commander', { waitUntil: 'domcontentloaded' });

    // Attendre que le wizard soit visible
    await page.waitForSelector('text=Choisissez votre format', { timeout: 10000 });
  });

  test('Diagnostic z-index pour phone-portrait + card-landscape', async ({ page }) => {
    console.log('\n=== DIAGNOSTIC Z-INDEX: Vidéo portrait + Photo paysage ===\n');

    const diagnosticData: any = {
      testName: 'phone-portrait-card-landscape',
      timestamp: new Date().toISOString(),
      elements: [],
      issues: []
    };

    // Étape 0: Sélectionner le format Classique
    await test.step('Select format', async () => {
      console.log('Step 0: Selecting format...');

      // Cliquer sur le format "Classique"
      const formatButton = page.locator('button:has-text("Sélectionner")').first();
      await formatButton.click();
      await page.waitForTimeout(1000);

      console.log('✓ Format selected');
    });

    // Étape 1: Upload vidéo portrait
    await test.step('Upload portrait video', async () => {
      console.log('Step 1: Uploading portrait video...');

      const videoInput = page.locator('input[type="file"]').first();
      await videoInput.setInputFiles(path.join(__dirname, 'fixtures', 'video-portrait.mp4'));

      // Attendre que la vidéo soit chargée
      await page.waitForTimeout(2000);

      console.log('✓ Portrait video uploaded');
    });

    // Passer à l'étape 2
    await test.step('Go to upload step', async () => {
      console.log('Step 2: Going to upload step...');

      const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Continuer")').first();
      await nextButton.click();
      await page.waitForTimeout(1000);

      console.log('✓ Navigated to upload step');
    });

    // Étape 2: Upload photo paysage
    await test.step('Upload landscape photo', async () => {
      console.log('Step 3: Uploading landscape photo...');

      const photoInput = page.locator('input[type="file"]').last();
      await photoInput.setInputFiles(path.join(__dirname, 'fixtures', 'photo-landscape.jpg'));

      // Attendre que la photo soit chargée
      await page.waitForTimeout(2000);

      // Cliquer sur "Valider le cadrage" si présent
      const validateButton = page.locator('button:has-text("Valider"), button:has-text("Confirmer")').first();
      if (await validateButton.isVisible()) {
        await validateButton.click();
        await page.waitForTimeout(1000);
      }

      console.log('✓ Landscape photo uploaded');
    });

    // Analyse du mockup
    await test.step('Analyze mockup DOM and z-index', async () => {
      console.log('\nStep 4: Analyzing mockup structure...\n');

      // Trouver le conteneur du mockup
      const mockupContainer = page.locator('div.relative:has(img[alt="Mockup téléphone et carte"])').first();

      if (!(await mockupContainer.isVisible())) {
        console.error('❌ Mockup container not found!');
        await page.screenshot({
          path: path.join(__dirname, 'screenshots', 'mockup-not-found.png'),
          fullPage: true
        });
        throw new Error('Mockup container not visible');
      }

      console.log('✓ Mockup container found');

      // Capturer le HTML complet
      const mockupHTML = await mockupContainer.innerHTML();
      diagnosticData.html = mockupHTML;

      // Analyser chaque enfant du conteneur
      const children = await mockupContainer.locator('> *').all();
      console.log(`\nFound ${children.length} direct children in mockup container\n`);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        const tagName = await child.evaluate((el) => el.tagName.toLowerCase());
        const classes = await child.getAttribute('class') || '';
        const style = await child.getAttribute('style') || '';

        // Récupérer les styles calculés
        const computedStyles = await child.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            zIndex: computed.zIndex,
            position: computed.position,
            left: computed.left,
            top: computed.top,
            width: computed.width,
            height: computed.height
          };
        });

        // Récupérer le src si applicable
        let src = '';
        if (tagName === 'img' || tagName === 'video') {
          src = await child.getAttribute('src') || '';
        }

        const elementInfo: ElementInfo = {
          tagName,
          classes,
          zIndex: computedStyles.zIndex,
          position: computedStyles.position,
          src: src.substring(0, 50), // Tronquer pour lisibilité
          order: i
        };

        diagnosticData.elements.push({
          ...elementInfo,
          computedStyles,
          inlineStyle: style.substring(0, 100)
        });

        // Afficher les informations
        console.log(`[${i}] ${tagName.toUpperCase()}`);
        console.log(`    Classes: ${classes || '(none)'}`);
        console.log(`    Z-index: ${computedStyles.zIndex}`);
        console.log(`    Position: ${computedStyles.position}`);
        console.log(`    Dimensions: ${computedStyles.width} x ${computedStyles.height}`);
        if (src) console.log(`    Src: ${src.substring(0, 50)}...`);
        console.log('');
      }

      // Vérification de l'ordre attendu
      console.log('\n=== ORDER VERIFICATION ===\n');

      const expectedOrder = [
        { tag: 'img', description: 'Mockup background image' },
        { tag: 'div', description: 'Phone video zone' },
        { tag: 'div', description: 'Card photo zone' },
        { tag: 'button', description: 'Play button overlay' }
      ];

      let orderCorrect = true;

      for (let i = 0; i < Math.min(expectedOrder.length, diagnosticData.elements.length); i++) {
        const expected = expectedOrder[i];
        const actual = diagnosticData.elements[i];

        const matches = actual.tagName === expected.tag;
        const status = matches ? '✓' : '✗';

        console.log(`${status} Position ${i}: Expected ${expected.tag.toUpperCase()} (${expected.description})`);
        console.log(`    Actual: ${actual.tagName.toUpperCase()}`);

        if (!matches) {
          orderCorrect = false;
          diagnosticData.issues.push({
            type: 'ORDER_MISMATCH',
            position: i,
            expected: expected.tag,
            actual: actual.tagName,
            description: `Expected ${expected.tag} at position ${i}, found ${actual.tagName}`
          });
        }
      }

      // Vérification des z-index
      console.log('\n=== Z-INDEX VERIFICATION ===\n');

      const imgElement = diagnosticData.elements.find((el: any) => el.tagName === 'img');
      const divElements = diagnosticData.elements.filter((el: any) => el.tagName === 'div');
      const buttonElement = diagnosticData.elements.find((el: any) => el.tagName === 'button');

      if (imgElement) {
        console.log(`Mockup image z-index: ${imgElement.zIndex}`);
        if (imgElement.zIndex !== 'auto' && parseInt(imgElement.zIndex) > 0) {
          diagnosticData.issues.push({
            type: 'ZINDEX_WARNING',
            element: 'img',
            value: imgElement.zIndex,
            description: 'Mockup image should have z-index: auto or 0'
          });
        }
      }

      divElements.forEach((div: any, index: number) => {
        console.log(`Zone ${index + 1} z-index: ${div.zIndex}`);
      });

      if (buttonElement) {
        console.log(`Play button z-index: ${buttonElement.zIndex}`);
      }

      // Capture d'écran
      console.log('\n=== SCREENSHOTS ===\n');

      const screenshotsDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      // Screenshot du mockup complet
      await mockupContainer.screenshot({
        path: path.join(screenshotsDir, 'mockup-portrait-landscape-diagnostic.png')
      });
      console.log('✓ Screenshot saved: mockup-portrait-landscape-diagnostic.png');

      // Screenshot de la page complète
      await page.screenshot({
        path: path.join(screenshotsDir, 'full-page-diagnostic.png'),
        fullPage: true
      });
      console.log('✓ Screenshot saved: full-page-diagnostic.png');

      // Sauvegarder le rapport JSON
      const reportPath = path.join(screenshotsDir, 'diagnostic-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(diagnosticData, null, 2));
      console.log(`✓ Diagnostic report saved: diagnostic-report.json`);

      // Générer le rapport Markdown
      const markdownReport = generateMarkdownReport(diagnosticData);
      const mdPath = path.join(screenshotsDir, 'diagnostic-report.md');
      fs.writeFileSync(mdPath, markdownReport);
      console.log(`✓ Markdown report saved: diagnostic-report.md`);

      // Résumé final
      console.log('\n=== DIAGNOSTIC SUMMARY ===\n');
      console.log(`Total elements: ${diagnosticData.elements.length}`);
      console.log(`Issues found: ${diagnosticData.issues.length}`);
      console.log(`Order correct: ${orderCorrect ? 'YES' : 'NO'}`);

      if (diagnosticData.issues.length > 0) {
        console.log('\n⚠️  Issues detected:');
        diagnosticData.issues.forEach((issue: any, i: number) => {
          console.log(`  ${i + 1}. ${issue.type}: ${issue.description}`);
        });
      } else {
        console.log('\n✓ No issues detected - mockup structure looks correct!');
      }

      // Les assertions
      expect(diagnosticData.elements.length).toBeGreaterThanOrEqual(4);
    });
  });
});

function generateMarkdownReport(data: any): string {
  let md = `# Mockup Z-Index Diagnostic Report\n\n`;
  md += `**Test:** ${data.testName}\n`;
  md += `**Date:** ${data.timestamp}\n\n`;

  md += `## Summary\n\n`;
  md += `- Total elements: ${data.elements.length}\n`;
  md += `- Issues found: ${data.issues.length}\n\n`;

  md += `## DOM Structure\n\n`;
  md += `| Order | Tag | Classes | Z-Index | Position |\n`;
  md += `|-------|-----|---------|---------|----------|\n`;

  data.elements.forEach((el: any) => {
    const classes = el.classes || '(none)';
    md += `| ${el.order} | ${el.tagName} | ${classes} | ${el.zIndex} | ${el.position} |\n`;
  });

  if (data.issues.length > 0) {
    md += `\n## Issues Detected\n\n`;
    data.issues.forEach((issue: any, i: number) => {
      md += `### ${i + 1}. ${issue.type}\n\n`;
      md += `**Description:** ${issue.description}\n\n`;
      if (issue.expected) md += `- Expected: ${issue.expected}\n`;
      if (issue.actual) md += `- Actual: ${issue.actual}\n`;
      if (issue.value) md += `- Value: ${issue.value}\n`;
      md += `\n`;
    });
  } else {
    md += `\n## ✅ No Issues Found\n\n`;
    md += `The mockup structure and z-index configuration appear to be correct.\n\n`;
  }

  md += `## Expected Order\n\n`;
  md += `1. **IMG** - Mockup background image (z-index: auto)\n`;
  md += `2. **DIV** - Phone video zone (absolute positioning)\n`;
  md += `3. **DIV** - Card photo zone (absolute positioning)\n`;
  md += `4. **BUTTON** - Play button overlay (absolute positioning)\n`;

  return md;
}
