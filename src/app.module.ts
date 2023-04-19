import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './parser/parser.module';
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [ParserModule,
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/parser')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
