import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { MongooseModule } from "@nestjs/mongoose";
import { ParsedEntity, ParsedEntitySchema } from "./parsed-entity.schema";
import { ConfigModule } from "@nestjs/config";

@Module({
  controllers: [ParserController],
  providers: [ParserService],
  imports: [ConfigModule, MongooseModule.forFeature([{ name: ParsedEntity.name, schema: ParsedEntitySchema }])],
})
export class ParserModule {}
