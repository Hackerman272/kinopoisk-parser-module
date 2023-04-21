import { Inject, Injectable } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { taskEntityType, taskStatus, UploadingTask } from "./uploading-tasks.schema";
import {v4 as uuidv4} from 'uuid';
import { entityStatus, ParsedEntity } from "../parser/parsed-entity.schema";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";

const taskEntitiesStatusesMapping: {} = {
  "failed": "parsed",
  "processing": "uploadingToReceiver",
  "processed": "uploadedToReceiver"
}

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
      taskEntityType: dto.entityType,
      taskInternalId: taskInternalId,
      entitiesAmount: dto.entitiesAmount,
      taskStatus: taskStatus.Received,
    });
    await newTask.save()
    const JSONtoUpload = await this.prepareDataToRmq(taskInternalId, dto.entitiesAmount, dto.entityType)
    await this.uploadDataToRmq(taskInternalId, JSONtoUpload)
    return true;
  }

  private async uploadDataToRmq(taskInternalId, JSON) {
    await firstValueFrom(
      await this.taskRmqClient.send('upload_data', JSON)
    )
    await this.changeTaskStatus(taskInternalId, "processing")
  }

  private async addParsedEntitiesToJSON(taskInternalId, limit, entityType, JSONtoUpload) {
    const parsedEntities: any[] = await this.parserModel.find({
        entityType: entityType,
        status: entityStatus.Parsed
      }).limit(limit).exec();
    const parsedIdsQueueToUploading = parsedEntities.map(element => element.entityKinopoiskId);
    let update = {}

    // придумать как сделать красивее
    if (entityType === taskEntityType.Film) {
      update = { processingFilmsId: parsedIdsQueueToUploading }
    }
    if (entityType === taskEntityType.Review) {
      update = { processingReviewsId: parsedIdsQueueToUploading }
    }
    if (entityType === taskEntityType.Person) {
      update = { processingPersonsId: parsedIdsQueueToUploading }
    }

    await this.uploadingTaskModel.findOneAndUpdate({ taskInternalId: taskInternalId }, update);
    JSONtoUpload["parsedEntities"][entityType] = parsedEntities
  }

  private async prepareDataToRmq(taskInternalId, limit, entityType) {
    const taskDetails = await this.uploadingTaskModel.findOne({taskInternalId: taskInternalId})
    try {
      const JSONtoUpload: {} = {
        parsedEntities: {},
        parserInternalId: taskDetails.taskInternalId,
        externalId: taskDetails.taskExternalId
      };
      if (entityType === taskEntityType.Film || entityType === taskEntityType.All) {
        await this.addParsedEntitiesToJSON(taskInternalId, limit, taskEntityType.Film, JSONtoUpload)
      }
      if (entityType === taskEntityType.Review || entityType === taskEntityType.All) {
        await this.addParsedEntitiesToJSON(taskInternalId, limit, taskEntityType.Review, JSONtoUpload)
      }
      if (entityType === taskEntityType.Person || entityType === taskEntityType.All) {
        await this.addParsedEntitiesToJSON(taskInternalId, limit, taskEntityType.Person, JSONtoUpload)
      }
      await this.changeTaskStatus(taskInternalId, taskStatus.Processing)
      return JSONtoUpload;
    }
    catch (Error) {
      console.log(Error)
      await this.changeTaskStatus(taskInternalId, "failed")
      return false;
    }
  }

  private async markEntitiesWithStatus(entityType, status, IdsQueue) {
    await this.parserModel.updateMany({entityKinopoiskId: {$in: IdsQueue}, entityType: entityType},
      {status: status})
  }

  async changeTaskStatus(taskInternalId, taskStatus) {
    console.log(taskInternalId, taskStatus)
    const TaskData = await this.uploadingTaskModel.findOneAndUpdate({taskInternalId: taskInternalId},
      {taskStatus: taskStatus})
    const entityType = TaskData.taskEntityType

    const entityStatus = taskEntitiesStatusesMapping[taskStatus]
    if (entityType === taskEntityType.Film || entityType === taskEntityType.All) {
      await this.markEntitiesWithStatus(taskEntityType.Film, entityStatus, TaskData.processingFilmsId)
    }
    if (entityType === taskEntityType.Review || entityType === taskEntityType.All) {
      await this.markEntitiesWithStatus(taskEntityType.Review, entityStatus, TaskData.processingReviewsId)
    }
    if (entityType === taskEntityType.Person || entityType === taskEntityType.All) {
      await this.markEntitiesWithStatus(taskEntityType.Person, entityStatus, TaskData.processingPersonsId)
    }

    console.log({"message": `Статус задачи ${taskInternalId} изменён на ${taskStatus}`,
      "parserInternalId": taskInternalId})
    return {"message": `Статус задачи ${taskInternalId} изменён на ${taskStatus}`,
    "parserInternalId": taskInternalId}
  }


  async addTaskToReceive(dto: CreateTaskDto){
    await firstValueFrom(
      await this.taskRmqClient.send('create_uploading_task', dto)
    )
  }

  async test() {
    return true
  }

  async testTaskStatusChanging(updateTaskStatusDto: UpdateTaskStatusDto) {
    await firstValueFrom(
      await this.taskRmqClient.send('task_receiving_status', updateTaskStatusDto)
    )
  }
}
