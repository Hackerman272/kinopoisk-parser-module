import { Injectable } from '@nestjs/common';
import { NewParserDto } from "./dto/new-parser.dto";

@Injectable()
export class ParserService {
  async parseSomeNumberEntities(dto: NewParserDto) {
    const Kinopoisk = require('parsekino')

    async function start(url){
      Kinopoisk.url = url
      const result = await Kinopoisk.getInfo(url)
      console.log(result)
    }

    await start('https://www.kinopoisk.ru/film/5638/')

  }
}
