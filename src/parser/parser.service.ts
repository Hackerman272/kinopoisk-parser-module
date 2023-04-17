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

    await parseFilmByIdWithLinkedPersons(762738)

    // add i counter
    for (let id of parsingQueueFilms) {
      await parseFilmByIdWithLinkedPersons(id)
    }

    for (let id of parsingQueuePersons) {
      await parsePerson(id)
    }

    async function parsePerson(personId) {
      if (!parsedPersons.includes(personId)) {
        const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/name/${personId}/`)
        console.log(personId)
        resultFilmsPersonsData.persons.push(await newKinopoiskParser.getPerson(personId))
        parsedPersons.push(personId);
      }
    }

    async function parseFilmByIdWithLinkedPersons(filmId){
      if (parsedFilms.includes(filmId)) {
        return;
      }
      const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/film/${filmId}/`)
      let result = await newKinopoiskParser.getInfo()
      result["simularFilms"] = await newKinopoiskParser.getSimilar()
      result["simularFilms"].forEach(film => {
        const kinopoiskId = parseInt(film.url.split('/')[2])
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
    console.log(parsingQueuePersons)
    console.log(parsingQueueFilms)
    console.log(resultFilmsPersonsData)
  }
}
