import { Injectable } from '@nestjs/common';
import { NewParserDto } from "./dto/new-parser.dto";
import { Kinopoisk } from "./tools/parsekino/parse/kinopoisk";
import { InjectModel, Prop } from "@nestjs/mongoose";
import { ParsedEntity } from "./parsed-entity.schema";
import { Model } from "mongoose";

// всё переписано максимально последовательно, чтобы из-за десятков параллельных запросов не банил кинопописк.
// Параллельные варсии жёстко блокировались по IP.
@Injectable()
export class ParserService {
  constructor(@InjectModel(ParsedEntity.name) private parserModel: Model<ParsedEntity>) {}

  async parseSomeNumberEntities(dto: NewParserDto) {
    let parsingQueueFilmsArr: any[] = await this.parserModel.find({entityType: "film", status: "waitForParsing"}, 'entityKinopoiskId').limit(dto.entitiesAmount).exec()
    let parsingQueueFilms: Set<any> = new Set(parsingQueueFilmsArr.map(entry => entry.entityKinopoiskId))
    console.log(parsingQueueFilms)
    let parsingQueuePersonsArr: any[] = await this.parserModel.find({entityType: "person", status: "waitForParsing"}, 'entityKinopoiskId').limit(dto.entitiesAmount).exec()
    let parsingQueuePersons: Set<any> = new Set(parsingQueuePersonsArr.map(entry => entry.entityKinopoiskId))
    console.log(parsingQueuePersons)

    // заходим в цикл парсинга
    if (dto.startFilmId) {
      await parseFilmWithReviews.call(this, dto.startFilmId)
    } else {
      await parseFilmWithReviews.call(this, parsingQueueFilms[0].kinopoiskId)
    }

    await QueueWorker.call(this, 'film', parsingQueueFilms)
    await QueueWorker.call(this, 'person', parsingQueuePersons)

    async function parseFilmWithReviews(id) {
      if (await this.parserModel.exists({ entityKinopoiskId: id, entityType: "film", status: { $nin: ["waitForParsing", "notFound"] } }) === null) {
        await parseFilmByIdWithLinkedPersons.call(this, id);
      }
      if (await this.parserModel.exists({ entityKinopoiskId: id, entityType: "review", status: { $nin: ["waitForParsing", "notFound"]} }) === null) {
        await parseComment.call(this, id)
      }
    }
    async function QueueWorker(entityType, entitiesIdQueue) {
      try {
        let iterationCounter = 0
        for (let id of entitiesIdQueue) {
          if (entityType === 'film') {
            await parseFilmWithReviews.call(this, id)
            entitiesIdQueue.delete(id)
          } else {
            await parsePerson.call(this, id)
            entitiesIdQueue.delete(id)
          }
          iterationCounter += 1
          if (iterationCounter >= dto.entitiesAmount) {
            await saveWaitingEntities.call(this, entityType, entitiesIdQueue)
            break
          }
        }
      } catch (error) {
        console.log(error)
        await saveWaitingEntities.call(this, entityType, entitiesIdQueue)
      }
    }

    async function saveWaitingEntities(entityType, entitiesIdQueue) {
      console.log(entitiesIdQueue)
      for (let lastId of entitiesIdQueue) {
        if (await this.parserModel.exists({ entityKinopoiskId: lastId, entityType: entityType }) === null) {
          const newEntity = await this.parserModel.create({
            entityKinopoiskId: lastId,
            entityJSON: {},
            entityType: entityType,
            status: "waitForParsing",
          });
          await newEntity.save()
        }
      }
    }


    async function entityCreateOrUpdate(entityInfo, entityId: number, entityType) {
      console.log(entityId)
      const updateResponse = await this.parserModel.findOneAndUpdate({
        entityKinopoiskId: entityId,
        entityType: entityType
      }, {
        entityJSON: entityInfo,
        entityType: entityType,
        status: "parsed"
      }, {}).exec();
      if (updateResponse === null) {
        const newEntity = await this.parserModel.create({
          entityKinopoiskId: entityId,
          entityJSON: entityInfo,
          entityType: entityType,
          status: "parsed",
        });
        await newEntity.save()
      }
    }

    async function parseComment(filmId) {
        const newKinopoiskParser = new Kinopoisk('')
        const commentInfo = await newKinopoiskParser.getReviews(filmId)
        if (commentInfo.length === 0) {
          return
        }
        await entityCreateOrUpdate.call(this, commentInfo, filmId, "review")
    }

    async function parsePerson(personId) {
        const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/name/${personId}/`)
        // console.log(personId)
        const personInfo = await newKinopoiskParser.getPerson(personId)
        if (personInfo.error) {
          return
        }
        await entityCreateOrUpdate.call(this, personInfo, personId, "person")
    }

    async function parseFilmByIdWithLinkedPersons(filmId){
      const newKinopoiskParser = new Kinopoisk(`https://www.kinopoisk.ru/film/${filmId}/`)
      let result = await newKinopoiskParser.getInfo()
      if (result.error) {
        return
      }
      result["simularFilms"] = await newKinopoiskParser.getSimilar()
      result["simularFilms"].forEach(film => {
        const kinopoiskId = parseInt(film.url.split('/')[2])
        parsingQueueFilms.add(kinopoiskId)

      })
      result["kinopoiskId"] = filmId

      await entityCreateOrUpdate.call(this, result, filmId, "film")

      result.encyclopedia.forEach(dataItem => {
        if (dataItem.type === 'person') {
          if (dataItem.value instanceof Array){
            dataItem.value.forEach(personId => {
              // добавляем в очередь, чтобы лишний раз не дёргать БД. Не обработанные записи из очереди уже идут в БД
              parsingQueuePersons.add(personId)
            });
          }
        }
      })
      result.actors.forEach(actor => {
        const personId = parseInt(actor.link.split('/')[2])

        // добавляем в очередь, чтобы лишний раз не дёргать БД. Не обработанные записи из очереди уже идут в БД
        parsingQueuePersons.add(personId)
      })
    }
  }
}
