const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 2000 });
    
    // Screenshot 1: Tactical Gallery (shows different formations)
    console.log('Navigating to gallery...');
    await page.goto('http://localhost:3000/laboratorio/tactical-gallery', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'gallery.png', fullPage: true });
    console.log('Saved gallery.png');
    
    // Screenshot 2: Match to check MVP and subs
    console.log('Navigating to predictions match...');
    await page.goto('http://localhost:3000/predictions', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'predictions.png', fullPage: true });
    console.log('Saved predictions.png');

    await browser.close();
    console.log('Done capturing.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
