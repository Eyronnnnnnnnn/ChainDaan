const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/AARON/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true});
  const page = await browser.newPage({viewport:{width:1123,height:794}});
  await page.goto('file:///' + path.join(__dirname,'system-architecture.html').replaceAll('\\','/'));
  await page.pdf({path:path.join(__dirname,'Chain-Daan-System-Architecture.pdf'),format:'A4',landscape:true,printBackground:true,preferCSSPageSize:true});
  const sizes = await page.locator('.page').evaluateAll(pages=>pages.map(p=>({height:p.scrollHeight,limit:p.clientHeight})));
  console.log(JSON.stringify({pages:sizes,bytes:fs.statSync(path.join(__dirname,'Chain-Daan-System-Architecture.pdf')).size}));
  await page.screenshot({path:path.join(__dirname,'preview.png'),fullPage:false});
  await browser.close();
})();
