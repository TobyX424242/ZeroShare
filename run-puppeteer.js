const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    
    await page.goto('file://' + __dirname + '/test-mlkem.html');
    await page.waitForFunction('window.testResults !== undefined', { timeout: 10000 });
    
    console.log("FINAL STATUS:", await page.evaluate(() => window.testResults));
    
    await browser.close();
})();
