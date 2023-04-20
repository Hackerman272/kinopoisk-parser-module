import { Module } from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { ConnectorController } from './connector.controller';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";
import { MongooseModule } from "@nestjs/mongoose";
import { ParsedEntity, ParsedEntitySchema } from "../parser/parsed-entity.schema";
import { EntitiesCounter, ParserCounterSchema } from "../parser/parser-counters.schema";
import { UploadingTask, UploadingTaskSchema } from "./uploading-tasks.schema";

@Module({
  providers: [ConnectorService,
    {
      provide: 'TASK_RMQ_SERVICE',
      useFactory: (configService: ConfigService) => {
        const user = configService.get('RABBITMQ_USER');
        const password = configService.get('RABBITMQ_PASSWORD');
        const host = configService.get('RABBITMQ_HOST');
        const queueName = configService.get('RABBITMQ_UPLOADING_TASKS_QUEUE');

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${user}:${password}@${host}`],
            queue: queueName,
            queueOptions: {
              durable: true,
            },
          },
        })
      },
      inject: [ConfigService],
    }],
  controllers: [ConnectorController],
  imports: [MongooseModule.forFeature([{ name: UploadingTask.name, schema: UploadingTaskSchema }]),
    MongooseModule.forFeature([{ name: UploadingTask.name, schema: UploadingTaskSchema }]),
    MongooseModule.forFeature([{ name: ParsedEntity.name, schema: ParsedEntitySchema }]),
    MongooseModule.forFeature([{ name: EntitiesCounter.name, schema: ParserCounterSchema }]),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`
    }),]
})
export class ConnectorModule {}
