import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './parser/parser.module';
import { MongooseModule } from "@nestjs/mongoose";
import { ConnectorModule } from './connector/connector.module';
import { ConfigModule } from "@nestjs/config";
import * as process from "process";

@Module({
  imports: [ParserModule,
    ConnectorModule,
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/parser'),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
