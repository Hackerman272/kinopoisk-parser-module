const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

class Browser{

    static async fetchHtml(url){
       return  fetch(url)
                .then((response) => {
                    return response.text();
                })
                .then((data) => {
                    return data
                });
    }
    static async fetchJson(url){
          return fetch(url)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    return data
                });
    }

    static async getHtml(url,scr){
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
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


        if(scr == true){
            await page.screenshot({ path: 'example.png' });
        }

        const bodyHTML = await page.evaluate(() => {return document.body.innerHTML})
        await browser.close()

        return bodyHTML

    }
}

module.exports = Browser
