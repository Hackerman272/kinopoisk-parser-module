# Kinopoisk Films Parse
Parse data about movies on the site kinopoisk.ru

## Install
```
npm install parsekino
```
## Usage
```
const  Kinopoisk = require('parsekino')

async function start(url){
    Kinopoisk.url = url
    const result = await Kinopoisk.getInfo(url)
}

start('https://www.kinopoisk.ru/film/1048334/')
```

## Example
```
index.js

const  Kinopoisk = require('parsekino')

async function start(url){
    Kinopoisk.url = url
    const result = await Kinopoisk.getInfo(url)
}

start('https://www.kinopoisk.ru/film/1048334/')

===================================================
===================================================
===================================================

Console Result:

{
    name: 'Джокер (2019)',
    
    originalName: 'Joker',
    
    description: 'Готэм, начало 1980-х годов. Комик Артур Флек живет с больной матерью, 
                  которая с детства учит его «ходить с улыбкой». Пытаясь нести в мир хорошее 
                  и дарить людям радость, Артур сталкивается с человеческой жестокостью и постепенно 
                  приходит к выводу, что этот мир получит от него не добрую улыбку, а ухмылку злодея Джокера.',
    actors: [
        { name: 'Хоакин Феникс', link: '/name/10020/' },
        { name: 'Роберт Де Ниро', link: '/name/718/' },
        { name: 'Зази Битц', link: '/name/3394604/' },
        { name: 'Фрэнсис Конрой', link: '/name/40447/' },
        { name: 'Бретт Каллен', link: '/name/9562/' },
        { name: 'Шей Уигэм', link: '/name/34780/' },
        { name: 'Билл Кэмп', link: '/name/63403/' },
        { name: 'Гленн Флешлер', link: '/name/45969/' },
        { name: 'Ли Гилл', link: '/name/3098814/' },
        { name: 'Джош Пэйс', link: '/name/8455/' }
  ],

    
    rate: {
        kinopoisk: '7.973',
        kinopoiskCount: '451K',
        imdb: 'IMDb: 8.40',
        imdbCount: '451K'
    },

    encyclopedia: [
        { name: 'Год производства', value: '2019' },
        { name: 'Страна', value: 'США, Канада' },
        { name: 'Жанр', value: 'триллер, драма, криминалслова' },
        { name: 'Слоган', value: '«Сделай счастливое лицо»' },
        { name: 'Режиссер', value: 'Тодд Филлипс' },
        {
            name: 'Сценарий',
            value: 'Тодд Филлипс, Скотт Сильвер, Боб Кейн, ...'
        },
        { 
            name: 'Продюсер',
            value: 'Ричард Баратта, Брюс Берман, Джейсон Клот, ...'
        },
            { name: 'Оператор', value: 'Лоуренс Шер' },
            { name: 'Композитор', value: 'Хильдур Гуднадоуттир' },
        {
            name: 'Художник',
            value: 'Марк Фридберг, Лора Боллинджер, Марк Бриджес, ...'
        },
            { name: 'Монтаж', value: 'Джефф Грот' },
            { name: 'Бюджет', value: '$55 000 000' },
            { name: 'Сборы в США', value: '$335 451 311' },
        {
            name: 'Сборы в мире',
            value: '+ $738 800 000 = $1 074 251 311сборы'
        },
            { name: 'Зрители', value: '7.1 млн , ...' },
            { name: 'Сборы в России', value: '$31 418 225' },
        {
            name: 'Премьера в Росcии',
            value: '3 октября 2019, «Каро-Премьер»IMAX'
        },
       { name: 'Премьера в мире', value: '31 августа 2019, ...' },
       {
            name: 'Цифровой релиз',
            value: '27 декабря 2019, «Warner Bros.»'
        },
        { name: 'Возраст', value: '18+' },
        {
            name: 'Рейтинг MPAA',
            value: 'Rлицам до 17 лет обязательно присутствие взрослого'
        },
        { name: 'Время', value: '122 мин. / 02:02' }
    ]
```

## Contributors
Vlad Imir

