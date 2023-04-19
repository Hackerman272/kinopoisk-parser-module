const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

export class Browser {
    private delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time)
        });
    }
    async fetchHtml(url: string){
       return  fetch(url)
                .then((response) => {
                    return response.text();
                })
                .then((data) => {
                    return data
                });
    }
    async fetchJson(url){
          return fetch(url)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    return data
                });
    }

    async getHtml(url: string, scr, needClick: boolean = false,
                  clickTarget: string | undefined = undefined){
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent="Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
        ];

        const chromeOptions = {
            args,
            headless: true,
            slowMo:50,
        };

        const browser = await puppeteer.launch(chromeOptions)
        const page = await browser.newPage();

        await page.setViewport({
            width: 1920,
            height: 1080
        })


        await page.goto(url)
        await page.waitForTimeout(20)

        // console.log(await page.evaluate(() => {return document.body.innerHTML}))
        let captchaProtection = (await page.$('.CheckboxCaptcha-Button')) || null;
        if (captchaProtection !== null) {
            console.log('!!! parsing protection ON !!!')
            await this.delay(Math.floor(Math.random() * 10000 + 1000));
            const searchResultSelector = 'CheckboxCaptcha-Button';
            await page.waitForXPath(`//input [@class='${searchResultSelector}']`)
            await page.click(`.${searchResultSelector}`)
            await browser.close()
            return await this.getHtml(url, scr, needClick, clickTarget)
        }

        if (needClick === true) {
            // Wait and click on first result
            // console.log(await page.evaluate(() => {return document.body.innerHTML}))
            const searchResultSelector = clickTarget;
            await page.waitForXPath(`//div [@class='${clickTarget}']`);
            await page.click(`.${searchResultSelector}`);
        }

        if(scr == true){
            await page.screenshot({ path: 'example.png' });
        }

        const bodyHTML = await page.evaluate(() => {return document.body.innerHTML})
        await browser.close()

        return bodyHTML
    }
}
