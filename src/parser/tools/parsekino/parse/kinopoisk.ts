import { Browser } from "../browser/browser"
const jsdom = require("jsdom")
const {JSDOM} = jsdom

export class Kinopoisk {
    public url: string;
    public scr: boolean;
    public dom: any;

    constructor(url: string, scr = false) {
        this.url = url;
        this.dom = '';
        this.scr = scr;
    }

    async getPerson(personId: number) {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(`https://www.kinopoisk.ru/name/${personId}`, this.scr)
        const dom = new JSDOM(domHtml);
        let photoLink: string = '';
        const photoLinkOrPlaceholder: string = dom.window.document.querySelector('.styles_root__DZigd').getAttribute("src")
        if (photoLinkOrPlaceholder !== "https://yastatic.net/s3/kinopoisk-frontend/common-static/img/projector-logo/placeholder.svg") {
            photoLink = photoLinkOrPlaceholder
        }
        const name: string = dom.window.document.querySelector('.styles_primaryName__2Zu1T').textContent
        const enName: string = dom.window.document.querySelector('.styles_secondaryName__MpB48').textContent
        let professionArr: {}[] = []
        const professionElement = dom.window.document.querySelectorAll('.styles_row__da_RK')
        professionElement.forEach((el) => {
            if (el.querySelector('.styles_title__b1HVo').textContent === "Карьера") {
                professionArr.push(el.querySelector('.styles_role__s4xV4').textContent)
            }
        })
        return {
            "kinopoiskId": personId,
            "photoLink": photoLink,
            "name": name,
            "enName": enName,
            "professions": professionArr
        }
    }

    async getSimilar() {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(this.url + '/like', this.scr)
        const dom = new JSDOM(domHtml);

        const result = []

        const similar = dom.window.document.querySelectorAll('.news')
        similar.forEach((el) => {
            result.push({
                'name': el.querySelector('a').textContent,
                'url': el.querySelector('a').getAttribute('href')
            })
        })
        return result
    }

    async getInfo(scr = false) {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(this.url, this.scr)
        const dom = new JSDOM(domHtml);
        this.dom = dom
        if (dom.window.document.querySelector('.Text_typography_control-xxl')) {

            console.log(dom.window.document.querySelector('body').textContent)
            // return {
            //     'error': 'Yandex has turned on the anti-robot'
            // }
        }

        const encyclopedia = this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'))
        const actors: any[] = this.checkActors()

        let description = ''
        if(dom.window.document.querySelector('p.styles_paragraph__wEGPz')){
            description = dom.window.document.querySelector('p.styles_paragraph__wEGPz').textContent
        }

        let year: string | number = ''
        for (let element of encyclopedia) {
            if(element.name === 'Год производства'){
                year = parseInt(element.value)
                break
            }
        }

        let poster = ''
        if(dom.window.document.querySelector('.film-poster')){
            poster = dom.window.document.querySelector('.film-poster').getAttribute('src');
        }

        let trailerLink = ''
        if(dom.window.document.querySelector('.film-trailer')){
            let trailerUrlLocation: string = ''
            trailerUrlLocation = dom.window.document.querySelector('.film-trailer')
              .querySelector('.styles_title__vd96O')
              .getAttribute('href');
            const trailerPage = await new Browser()
            const trailerHtml = await trailerPage.getHtml(`https://www.kinopoisk.ru${trailerUrlLocation}`,
              this.scr, true, 'js-kinopoisk-widget-embed')
            const domTrailer = new JSDOM(trailerHtml);
            trailerLink = domTrailer.window.document.querySelector('.discovery-trailers-embed-iframe').getAttribute('src')
        }

        return {
            'name': dom.window.document.querySelector('h1').textContent,
            'originalName': this.checkContent('.styles_originalTitle__JaNKM'),
            'description': description,
            'actors': actors,
            'poster': poster,
            'trailerLink': trailerLink,
            'year': year,
            'rate': {
                'kinopoisk': this.checkContent('a.film-rating-value'),
                'kinopoiskCount': this.checkContent(' .styles_count__iOIwD'),
                'imdb': this.checkContent('span.styles_valueSection__0Tcsy').split(' ')[1],
                'imdbCount': this.checkContent('.styles_count__89cAz')
            },

            'encyclopedia': encyclopedia,

        }

    }

    parseEncyclopedia(node) {
        const encyclopedia = []
        node.forEach((el) => {
            const elName = el.querySelector('.styles_title__b1HVo').textContent
            let elValue: string = '';
            let elValueArr: number[] = []
            let elLink: string = ''
            let elType: string = 'details'
            try {
                elLink = el.querySelector('.styles_link__3QfAk').getAttribute('href')
                if (elLink.includes("/name/")) {
                    elType = 'person'
                    el.querySelectorAll('.styles_link__3QfAk').forEach(person => {
                        const personHref = person.getAttribute("href")
                        if (personHref.includes("/name/")) {
                            elValueArr.push(parseInt(personHref.split('/')[2]))
                        }
                    })
                } else {
                    elValue = el.querySelector('.styles_value__g6yP4').textContent
                    if (elName === "Жанр") {
                        elValue = elValue.replace('слова', '')
                    }
                }
            } catch (e) {
                // console.log(e)
            }
            encyclopedia.push({
                'name': elName,
                'value': (elValueArr.length === 0)? elValue: elValueArr,
                'type': elType
            })
        })
        return encyclopedia
    }

    parseName(node) {
        const name = []
        node.forEach((el) => {
            name.push({
                'name': el.querySelector('a.styles_link__Act80').textContent,
                'link': el.querySelector('a.styles_link__Act80').getAttribute('href'),
            })
        })
        return name

    }

    checkContent(selector) {
        let result = ''

        try {
            result = this.dom.window.document.querySelector(selector).textContent
        } catch {
            result = ''
        }

        return result
    }

    checkActors(){
        let result:any[];

        try {
            result = this.parseName(this.dom.window.document.querySelector('.styles_actors__wn_C4')
                .querySelectorAll('.styles_root__vKDSE '))
        } catch(Error) {
            // console.log(Error)
            result = []
        }
        // console.log(result)
        return result
    }

}
