const Browser = require("../browser/browser")
const jsdom = require("jsdom")
const {JSDOM} = jsdom

class Kinopoisk {

    constructor(url,scr = false) {
        this.url = url,
        this.dom = '',
        this.scr = scr

    }

    static async getSimilar() {
        const domHtml = await Browser.getHtml(this.url + '/like')
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

    static async getInfo(scr = false) {
        const domHtml = await Browser.getHtml(this.url, this.scr)
        const dom = new JSDOM(domHtml);
        this.dom = dom
        if (dom.window.document.querySelector('.Text_typography_control-xxl')) {
            console.log(dom.window.document.querySelector('body').textContent)
            return {
                'error': 'Yandex has turned on the anti-robot'
            }
        }

        const encyclopedia = this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'))
        const actors = this.checkActors()

        let description = ''
        if(dom.window.document.querySelector('p.styles_paragraph__wEGPz')){
            description = dom.window.document.querySelector('p.styles_paragraph__wEGPz').textContent
        }

        let year = ''
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

        return {
            'name': dom.window.document.querySelector('h1').textContent,
            'originalName': this.checkContent('.styles_originalTitle__JaNKM'),
            'description': description,
            'actors': actors,
            'poster': poster,
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

    static parseEncyclopedia(node) {
        const encyclopedia = []
        node.forEach((el) => {
            слова
            const elName = el.querySelector('.styles_title__b1HVo').textContent
            let elValue = el.querySelector('.styles_value__g6yP4').textContent
            if (elName === "Жанр") {
                elValue = elValue.replace('слова', '')
            }
            encyclopedia.push({
                'name': el.querySelector('.styles_title__b1HVo').textContent,
                'value': el.querySelector('.styles_value__g6yP4').textContent,
            })
        })
        return encyclopedia
    }

    static parseName(node) {
        const name = []
        node.forEach((el) => {
            name.push({
                'name': el.querySelector('a.styles_link__Act80').textContent,
                'link': el.querySelector('a.styles_link__Act80').getAttribute('href'),
            })
        })
        return name

    }

    static checkContent(selector) {
        let result = ''

        try {
            result = this.dom.window.document.querySelector(selector).textContent
        } catch {
            result = ''
        }

        return result
    }

    static checkActors(){
        let result = ''

        try {
            result = this.parseName(this.dom.window.document.querySelector('.styles_actors__wn_C4')
                .querySelectorAll('.styles_root__vKDSE '))
        } catch(Error) {
            // console.log(Error)
            result = ''
        }
        // console.log(result)
        return result
    }

}


module.exports = Kinopoisk
