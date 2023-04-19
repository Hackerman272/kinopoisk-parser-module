import { Injectable } from '@nestjs/common';
import { NewParserDto } from "./dto/new-parser.dto";
import { Kinopoisk } from "./tools/parsekino/parse/kinopoisk";
import { errorContext } from "rxjs/internal/util/errorContext";
import { InjectModel } from "@nestjs/mongoose";
import { ParsedEntity } from "./parsed-entity.schema";
import { Model } from "mongoose";
import { EntitiesCounter } from "./parser-counters.schema";

// всё переписано максимально последовательно, чтобы из-за десятков параллельных запросов не банил кинопописк.
// Параллельные варсии жёстко блокировались по IP.
@Injectable()
export class ParserService {
  constructor(@InjectModel(ParsedEntity.name) private parserModel: Model<ParsedEntity>,
              @InjectModel(EntitiesCounter.name) private parserCounter: Model<EntitiesCounter>) {}

  private arrayRange = (start, stop, step) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (value, index) => start + index * step
    );

  async parseSomeNumberEntities(dto: NewParserDto) {
    let filmsPersonsKinopoiskIdCounter = await this.parserCounter.find({}).exec();
    let startingKinopoiskFilmId = 0
    let startingKinopoiskPersonId = 0
    if (filmsPersonsKinopoiskIdCounter.length !== 0) {
        startingKinopoiskFilmId = filmsPersonsKinopoiskIdCounter["lastParsedFilmId"]
        startingKinopoiskPersonId = filmsPersonsKinopoiskIdCounter["lastParsedPersonId"]
    }
    let parsingQueueFilms: number[] = []
      // this.arrayRange(startingKinopoiskFilmId, startingKinopoiskFilmId + dto.entitiesAmount, 1);
    let parsingQueuePersons: number[] = []
      // this.arrayRange(startingKinopoiskPersonId, startingKinopoiskPersonId + dto.entitiesAmount, 1);
    let parsingQueueComments: number[] = []

    let parsedFilms: number[] = []
    let parsedPersons: number[] = []

    let resultFilmsPersonsData = {
      "films": [],
      "persons": [],
      "comments": []
    }

    await parseFilmByIdWithLinkedPersons(dto.startFilmId)

    let iterationCounter = 0
    for (let id of parsingQueueFilms) {
      await parseFilmByIdWithLinkedPersons(id);
      await parseComment(id)
      // setTimeout(() => {
      //   parseFilmByIdWithLinkedPersons(id);
      // }, Math.floor(Math.random() * dto.requestsDelay));
      iterationCounter += 1
      if (iterationCounter === dto.entitiesAmount) {
        break
      }
    }

    iterationCounter = 0
    for (let id of parsingQueuePersons) {
      await parsePerson(id)
      // setTimeout(() => {
      //   parsePerson(id)
      // }, Math.floor(Math.random() * dto.requestsDelay));
      iterationCounter += 1
      if (iterationCounter === dto.entitiesAmount) {
        break
      }
    }
    //
    // iterationCounter = 0
    // for (let id of parsingQueueComments) {
    //   await parseComment(id)
    //   // setTimeout(() => {
    //   //   parsePerson(id)
    //   // }, Math.floor(Math.random() * dto.requestsDelay));
    //   iterationCounter += 1
    //   if (iterationCounter === dto.entitiesAmount) {
    //     break
    //   }
    // }

    async function parseComment(filmId) {
        const newKinopoiskParser = new Kinopoisk('')
        const commentInfo = await newKinopoiskParser.getReviews(filmId)
        if (commentInfo.length === 0) {
          return
        }
        resultFilmsPersonsData.comments.push()
    }

    async function parsePerson(personId) {
      if (!parsedPersons.includes(personId)) {
        const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/name/${personId}/`)
        // console.log(personId)
        const personInfo = await newKinopoiskParser.getPerson(personId)
        if (personInfo.error) {
          return
        }
        resultFilmsPersonsData.persons.push()
        parsedPersons.push(personId);
      }
    }

    async function parseFilmByIdWithLinkedPersons(filmId){
      if (parsedFilms.includes(filmId)) {
        return;
      }
      const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/film/${filmId}/`)
      let result = await newKinopoiskParser.getInfo()
      if (result.error) {
        return
      }
      result["simularFilms"] = await newKinopoiskParser.getSimilar()
      result["simularFilms"].forEach(film => {
        const kinopoiskId = parseInt(film.url.split('/')[2])
        if (!parsedFilms.includes(kinopoiskId)) {
          parsingQueueFilms.push(kinopoiskId)
        }
      })
      result["kinopoiskId"] = filmId
      resultFilmsPersonsData.films.push(result)

      parsedFilms.push(filmId)
      result.encyclopedia.forEach(dataItem => {
        if (dataItem.type === 'person') {
          if (dataItem.value instanceof Array){
            dataItem.value.forEach(personId => {
              parsingQueuePersons.push(personId)
            });
          }
        }
      })
      result.actors.forEach(actor => {
        const personId = parseInt(actor.link.split('/')[2])
        parsingQueuePersons.push(personId)
      })
    }
    // console.log(parsingQueuePersons)
    // console.log(parsingQueueFilms)
    console.log(resultFilmsPersonsData)
  }
}
