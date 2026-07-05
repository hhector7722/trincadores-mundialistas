const puppeteer = require('puppeteer-core');
(async () => {
  try {
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // Mobile viewport
    
    // Set cookie to disable PWA overlay and auth
    await page.setCookie(
      { name: 'pwa_installed_dismissed', value: 'true', domain: 'localhost' },
      { name: 'user-alias', value: 'hector', domain: 'localhost' }
    );

    // Capture Individual Lineup (Spain)
    await page.goto('http://localhost:3000/teams/espana/lineup', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    // Click 'Ahora no' if modal is open
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.textContent && b.textContent.includes('Ahora no'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/hhect/.gemini/antigravity/brain/ba9255aa-5845-4d02-ae67-26f88e6a5333/scratch/individual_lineup.png' });
    console.log('Saved individual_lineup.png');

    // Capture Faced Lineup (Posibles Onces)
    await page.goto('http://localhost:3000/predictions/8', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    // Click 'Ahora no' if modal is open
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.textContent && b.textContent.includes('Ahora no'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'C:/Users/hhect/.gemini/antigravity/brain/ba9255aa-5845-4d02-ae67-26f88e6a5333/scratch/faced_lineup.png' });
    console.log('Saved faced_lineup.png');

    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();
