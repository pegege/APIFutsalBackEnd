const puppeteer = require('puppeteer');

async function test() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log('✅ Puppeteer iniciado');

    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

    console.log('⌛ Esperando 2 segundos...');
    await page.waitForTimeout(2000);

    console.log('✅ waitForTimeout funciona perfecto');

    await browser.close();
}

test().catch(console.error);
