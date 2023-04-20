import { Browser } from "../browser/browser";

const jsdom = require("jsdom")
const {JSDOM} = jsdom


// всё переписано максимально последовательно, чтобы из-за десятков параллельных запросов не банил кинопописк
export class Kinopoisk {
    public url: string;
    public scr: boolean;
    public dom: any;

    constructor(url: string, scr = false) {
        this.url = url;
        this.dom = '';
        this.scr = scr;
    }

    // чтобы не засорять огромным количеством рецензий БД парсим только 1 страницу обзоров
    // паршу вложенность комментариев до 3го уровня
    static async getComments(userId, reviewId) {
        console.log(userId, reviewId)
        const browser = await new Browser()
        const domHtml = await browser.getHtml(`https://www.kinopoisk.ru/user/${userId}/comment/${reviewId}/`, false)
        const dom = new JSDOM(domHtml);
        let commentsData = []
        await getCommentsLoop(0, null)
        async function getCommentsLoop(level: number = 0, parentId: number | null = null) {
            console.log(level, parentId, userId, reviewId)
            const commentsElements = dom.window.document.querySelectorAll(`.answer_${level}`)

            for (let commentTree of commentsElements) {
                try {
                    const commentId = parseInt(commentTree.querySelector(".toppy").getAttribute("id").replace("comment", ""));
                    const author = commentTree.querySelector(".name").textContent;
                    const text = commentTree.querySelector(".text").textContent;
                    const commentDate = commentTree.querySelector(".date").textContent.split(',')[0]
                    commentsData.push({
                        "commentId": commentId,
                        "author": author,
                        "text": text,
                        "parentId": parentId,
                        "commentDate": commentDate
                    });
                    level++
                    if (level > 2) {
                        return
                    }
                    await getCommentsLoop(level, commentId)
                } catch (Error) {
                    console.log(Error)
                    return
                }
            }
        }
        return commentsData

    }
    async getReviews(filmId: number) {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(`https://www.kinopoisk.ru/film/${filmId}/reviews/`, this.scr)
        const dom = new JSDOM(domHtml);
        if (dom.window.document.querySelector('.error-page__container') !== null) {
            return []
        }
        const result: any[] = []

        async function addReviewToResult(reviewEl) {
            const author =  reviewEl.querySelector('.profile_name').textContent
            const title = reviewEl.querySelector('.sub_title').textContent
            const text = reviewEl.querySelector('._reachbanner_').textContent
            const reviewId = reviewEl.getAttribute('data-id')
            const userId = reviewEl.querySelector('.profile_name').querySelector('a').getAttribute('href').split('/')[2]
            const reviewDate = reviewEl.querySelector('.date').textContent.split(' | ')[0]
            result.push({
                'author': author,
                'title': title,
                'text': text,
                'reviewId': reviewId,
                'userId': userId,
                'reviewDate': reviewDate,
                'comments': await Kinopoisk.getComments(userId, reviewId)
            })
        }

        const reviews = dom.window.document.querySelectorAll('.reviewItem')
        for (const review of reviews) {
            await addReviewToResult(review)
        }
        return result
    }

    async getPerson(personId: number) {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(`https://www.kinopoisk.ru/name/${personId}`, this.scr)
        const dom = new JSDOM(domHtml);
        if (dom.window.document.querySelector('.error-page__container') !== null) {
            return {
                "error": 404
            }
        }

        let photoLink: string = '';
        const photoLinkOrPlaceholder: string = dom.window.document.querySelector('.styles_root__DZigd').getAttribute("src")
        if (photoLinkOrPlaceholder !== "https://yastatic.net/s3/kinopoisk-frontend/common-static/img/projector-logo/placeholder.svg") {
            photoLink = photoLinkOrPlaceholder
        }
        const name: string = dom.window.document.querySelector('.styles_primaryName__2Zu1T').textContent

        let enName: string = ""
        if (dom.window.document.querySelector('.styles_secondaryName__MpB48')){
            enName = dom.window.document.querySelector('.styles_secondaryName__MpB48').textContent
        }

        let professionArr: {}[] = []
        const professionElement = dom.window.document.querySelectorAll('.styles_row__da_RK')
        professionElement.forEach((el) => {
            if (el.querySelector('.styles_title__b1HVo').textContent === "Карьера") {
                let professionArrNodes = el.querySelectorAll('.styles_role__s4xV4')
                professionArrNodes.forEach(node => {
                    professionArr.push(node.textContent)
                })
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
            const link =  el.querySelector('a').getAttribute('href')
            result.push({
                'name': el.querySelector('a').textContent,
                'url': link,
                'kinopoiskId': parseInt(link.split('/')[2])
            })
        })
        return result
    }

    async getInfo(scr = false) {
        const browser = await new Browser()
        const domHtml = await browser.getHtml(this.url, this.scr)
        const dom = new JSDOM(domHtml);
        this.dom = dom
        if (dom.window.document.querySelector('.error-page__container') !== null) {
            return {
                "error": 404
            }
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

        const genresArr = this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'), "genre")
        const countriesArr = this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'), "country")

        return {
            'name': dom.window.document.querySelector('h1').textContent,
            'originalName': this.checkContent('.styles_originalTitle__JaNKM')? this.checkContent('.styles_originalTitle__JaNKM') : dom.window.document.querySelector('h1').textContent,
            'description': description,
            'actors': actors,
            'poster': poster,
            'trailerLink': trailerLink,
            'year': year,
            'movieLength': this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'), "length"),
            'ageRating': this.parseEncyclopedia(dom.window.document.querySelectorAll('.styles_row__da_RK'), "ageLimit"),
            'genres': genresArr,
            'countries': countriesArr,
            'fullDescription': this.checkContent('.styles_paragraph__wEGPz'),
            'rate': {
                'kinopoisk': this.checkContent('a.film-rating-value'),
                'kinopoiskCount': this.checkContent(' .styles_count__iOIwD'),
                'imdb': this.checkContent('span.styles_valueSection__0Tcsy').split(' ')[1],
                'imdbCount': this.checkContent('.styles_count__89cAz')
            },

            'encyclopedia': encyclopedia,

        }

    }

    parseEncyclopedia(node, specialEntity: "genre" | "country" | "length" | "ageLimit" | null = null) {
        const encyclopedia = []
        for (let el of node) {
            const elName = el.querySelector('.styles_title__b1HVo').textContent
            if (specialEntity === "genre") {
                if (elName === "Жанр") {
                    const nodesArr = el.querySelectorAll('.styles_link__3QfAk')
                    return this.getDictDetailsArr(nodesArr, "genre")
                }
            }
            if (specialEntity ===  "country") {
                if (elName === "Страна") {
                    const nodesArr = el.querySelectorAll('.styles_link__3QfAk')
                    return this.getDictDetailsArr(nodesArr, "country")
                }
            }
            if (specialEntity ===  "length") {
                if (elName === "Время") {
                    return el.querySelector('.styles_value__g6yP4').textContent
                }
            }
            if (specialEntity ===  "ageLimit") {
                if (elName === "Возраст") {
                    return el.querySelector('.styles_value__g6yP4').textContent
                }
            }
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
        }
        return encyclopedia
    }

    getDictDetailsArr(nodes, dictType: "genre" | "country") {
        let result: {}[] = []
        nodes.forEach(node => {
            if (dictType === "genre") {
                if (!node.getAttribute("href").includes("keywords") && node.textContent !== "...") {
                    result.push({
                        "genre": node.textContent,
                        "genreEng": node.getAttribute("href").split("--")[1].split("/")[0]
                    })
                }
            } else {
                if (!node.getAttribute("href").includes("keywords") && node.textContent !== "...") {
                    result.push({
                        "country": node.textContent,
                        "countryId": parseInt(node.getAttribute("href").split("--")[1].split("/")[0])
                    })
                }
            }
        })
        return result
    }

    parseName(node) {
        const name = []
        node.forEach((el) => {
            const link = el.querySelector('a.styles_link__Act80').getAttribute('href')
            name.push({
                'name': el.querySelector('a.styles_link__Act80').textContent,
                'link': link,
                'kinopoiskId': parseInt(link.split('/')[2])
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
