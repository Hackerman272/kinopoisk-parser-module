import { Inject, Injectable } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { taskEntityType, taskStatus, UploadingTask } from "./uploading-tasks.schema";
import {v4 as uuidv4} from 'uuid';
import { entityStatus, entityType, ParsedEntity } from "../parser/parsed-entity.schema";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { response } from "express";
@Injectable()
export class ConnectorService {
  constructor(@InjectModel(UploadingTask.name) private uploadingTaskModel: Model<UploadingTask>,
              @InjectModel(ParsedEntity.name) private parserModel: Model<ParsedEntity>,
              @Inject('TASK_RMQ_SERVICE') readonly taskRmqClient: ClientProxy) {
  this.taskRmqClient.connect().then(result => console.log(result)).catch(error => console.log(error));
}
  async produceUploadingTask(dto: CreateTaskDto) {
    const taskInternalId = uuidv4()
    const newTask = await this.uploadingTaskModel.create({
      taskExternalId: dto.externalId,
      taskInternalId: taskInternalId,
      entitiesAmount: dto.entitiesAmount,
      taskStatus: taskStatus.Received,
    });
    await newTask.save()
    await this.uploadDataToRmq(taskInternalId, dto.entitiesAmount, dto.entityType)
    return true;
  }


  private async uploadDataToRmq(taskInternalId, limit, entityType) {
    const taskDetails = await this.uploadingTaskModel.findOneAndUpdate({taskInternalId: taskInternalId},
      {taskStatus: taskStatus.Processing})
    let parsedFilmsIdsQueueToUploading: number[]
    let parsedReviewsIdsQueueToUploading: number[]
    let parsedPersonsIdsQueueToUploading: number[]

    try {
      const JSONtoUpload: {} = {
        parsedEntities: {},
        parserInternalId: taskDetails.taskInternalId,
        externalId: taskDetails.taskExternalId
      };

      // завернуть в функцию
      if (entityType === taskEntityType.Film || entityType === taskEntityType.All) {
        const parsedFilms: any[] = await this.parserModel.find({
          entityType: taskEntityType.Film,
          status: entityStatus.Parsed
        }).limit(limit).exec();
        parsedFilmsIdsQueueToUploading = parsedFilms.map(element => element.entityKinopoiskId);
        await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedFilmsIdsQueueToUploading}}, {status: entityStatus.UploadingToReceiver})
        await this.uploadingTaskModel.findOneAndUpdate({ taskInternalId: taskInternalId }, { processingFilmsId: parsedFilmsIdsQueueToUploading });
        JSONtoUpload["parsedEntities"][entityType] = parsedFilms
      }
      if (entityType === taskEntityType.Review || entityType === taskEntityType.All) {
        const parsedReviews: any[] = await this.parserModel.find({
          entityType: taskEntityType.Review,
          status: entityStatus.Parsed
        }).limit(limit).exec()
        parsedReviewsIdsQueueToUploading = parsedReviews.map(element => element.entityKinopoiskId)
        await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedReviewsIdsQueueToUploading}}, {status: entityStatus.UploadingToReceiver})
        await this.uploadingTaskModel.findOneAndUpdate({ taskInternalId: taskInternalId }, { processingReviewsId: parsedReviewsIdsQueueToUploading });
        JSONtoUpload["parsedEntities"][entityType] = parsedReviews
      }

      if (entityType === taskEntityType.Person || entityType === taskEntityType.All) {
        const parsedPersons: any[] = await this.parserModel.find({
          entityType: taskEntityType.Person,
          status: entityStatus.Parsed
        }).limit(limit).exec()
        parsedPersonsIdsQueueToUploading = parsedPersons.map(element => element.entityKinopoiskId)
        await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedPersonsIdsQueueToUploading}}, {status: entityStatus.UploadingToReceiver})
        await this.uploadingTaskModel.findOneAndUpdate({ taskInternalId: taskInternalId }, { processingPersonsId: parsedPersonsIdsQueueToUploading });
        JSONtoUpload["parsedEntities"][entityType] = parsedPersons
      }

      await firstValueFrom(
        await this.taskRmqClient.send('upload_data', JSONtoUpload)
      )
      // console.log(taskInternalId)
      await this.uploadingTaskModel.findOneAndUpdate({ taskInternalId: taskInternalId }, {taskStatus: taskStatus.Processed})
    return true;
    }
    catch (Error) {
      this.uploadingTaskModel.findOneAndUpdate({taskInternalId: taskInternalId},
        {taskStatus: taskStatus.Failed})
      await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedFilmsIdsQueueToUploading}}, {entityStatus: entityStatus.Parsed})
      await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedReviewsIdsQueueToUploading}}, {entityStatus: entityStatus.Parsed})
      await this.parserModel.updateMany({entityKinopoiskId: {$in: parsedPersonsIdsQueueToUploading}}, {entityStatus: entityStatus.Parsed})
      return false;
    }
  }

  async addTaskToReceive(dto: CreateTaskDto){
    await firstValueFrom(
      await this.taskRmqClient.send('create_uploading_task', dto)
    )
  }

  async testReviewData() {
    console.log("sss6")
    return true
  }
}
