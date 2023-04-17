import { Injectable } from '@nestjs/common';
import { NewParserDto } from "./dto/new-parser.dto";
import { Kinopoisk } from "./tools/parsekino/parse/kinopoisk";
import { errorContext } from "rxjs/internal/util/errorContext";

@Injectable()
export class ParserService {
  async parseSomeNumberEntities(dto: NewParserDto) {
    let parsingQueueFilms: number[] = []
    let parsingQueuePersons: number[] = []
    let parsedFilms: number[] = []
    let parsedPersons: number[] = []

    let resultFilmsPersonsData = {
      "films": [],
      "persons": []
    }
    for (let i = 0; i <= dto.entitiesAmount; i++) {
      await parseFilmByIdWithLinkedPersons(762738)
      break
    }


    async function parseFilmByIdWithLinkedPersons(filmId){
      async function parsePerson(personId) {
        console.log(personId)
        if (!parsedPersons.includes(personId)) {
          console.log(personId)
          resultFilmsPersonsData.persons.push(await newKinopoiskParser.getPerson(personId))
          parsedPersons.push(personId);
          console.log(resultFilmsPersonsData.persons)
        }
      }
      const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/film/${filmId}/`)
      let result = await newKinopoiskParser.getInfo()
      result["simularFilms"] = await newKinopoiskParser.getSimilar()
      result["simularFilms"].forEach(film => {
        const kinopoiskId = parseInt(film.url.split('/')[4])
        if (!parsedFilms.includes(kinopoiskId)) {
          parsingQueueFilms.push(kinopoiskId)
          // setTimeout(() => {
          //   parseFilmByIdWithLinkedPersons(kinopoiskId);
          // }, Math.floor(Math.random() * dto.requestsDelay));
        }
      })
      result["kinopoiskId"] = filmId
      resultFilmsPersonsData.films.push(result)
      console.log(result)

      parsedFilms.push(filmId)
      result.encyclopedia.forEach(dataItem => {
        if (dataItem.type === 'person') {
          if (dataItem.value instanceof Array){
            dataItem.value.forEach(personId => {
              parsingQueuePersons.push(personId)
              // setTimeout(() => {
              //   parsePerson(personId);
              // }, Math.floor(Math.random() * dto.requestsDelay));
            });
          }
        }
      })
      result.actors.forEach(actor => {
        const personId = parseInt(actor.link.split('/')[2])
        parsingQueuePersons.push(personId)
      })
    }
    console.log(resultFilmsPersonsData)
  }
}
