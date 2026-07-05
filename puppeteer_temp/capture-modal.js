const puppeteer = require('puppeteer-core');
(async () => {
  try {
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // Mobile viewport
    await page.goto('http://localhost:3000/predictions', { waitUntil: 'networkidle0' });
    
    // Wait a bit just in case
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the Suplentes button using evaluate to find the text
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const subBtn = btns.find(b => b.textContent && b.textContent.includes('SUPLENTES'));
      if (subBtn) {
        subBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      await new Promise(r => setTimeout(r, 1000)); // Wait for modal animation
      await page.screenshot({ path: 'C:/Users/hhect/.gemini/antigravity/brain/ba9255aa-5845-4d02-ae67-26f88e6a5333/scratch/modal.png' });
      console.log('Saved modal.png');
    } else {
      console.log('Could not find Suplentes button');
      // Save a screenshot anyway to see what is rendering
      await page.screenshot({ path: 'C:/Users/hhect/.gemini/antigravity/brain/ba9255aa-5845-4d02-ae67-26f88e6a5333/scratch/modal-failed.png' });
    }
    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();
