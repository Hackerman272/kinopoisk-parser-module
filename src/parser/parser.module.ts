import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { MongooseModule } from "@nestjs/mongoose";
import { ParsedEntity, ParsedEntitySchema } from "./parsed-entity.schema";
import { EntitiesCounter, ParserCounterSchema } from "./parser-counters.schema";

@Module({
  controllers: [ParserController],
  providers: [ParserService],
  imports: [MongooseModule.forFeature([{ name: ParsedEntity.name, schema: ParsedEntitySchema }]),
    MongooseModule.forFeature([{ name: EntitiesCounter.name, schema: ParserCounterSchema }])],
})
export class ParserModule {}
