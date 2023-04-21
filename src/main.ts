import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {Transport} from "@nestjs/microservices";
import {ConfigService} from "@nestjs/config";
import * as process from "process";

async function bootstrap() {
  const PORT = process.env.PORT || 5001;

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const rabbitMQ_cloud_url = configService.get('RABBITMQ_CLOUD_URL')
  const queueName = configService.get('RABBITMQ_UPLOADING_TASKS_QUEUE');

  const microservice = app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitMQ_cloud_url],
      queue: queueName,
      queueOptions: {
        durable: true
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

bootstrap();
