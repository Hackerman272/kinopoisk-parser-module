import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { CreateTaskDto } from "./dto/create-task.dto";
import { ConnectorService } from "./connector.service";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { SecretKeyGuard } from "../guards/secret-key.guard";

@Controller('connector')
export class ConnectorController {
  constructor(private connectorService: ConnectorService) {
  }
  @EventPattern('create_uploading_task')
  createUploadingTask(@Body() createTaskDto: CreateTaskDto) {
    return this.connectorService.produceUploadingTask(createTaskDto);
  }

  // Не запрещаю менять статус с processed на failed для большей гибкости
  @EventPattern('task_receiving_status')
  updateTaskReceivingStatus(@Body() updateTaskStatusDto: UpdateTaskStatusDto) {
    return this.connectorService.changeTaskStatus(updateTaskStatusDto.parserInternalId, updateTaskStatusDto.taskStatus);
  }

  @Post('/add_task')
  @UseGuards(SecretKeyGuard)
  addTaskToReceive(@Body() dto: CreateTaskDto){
    this.connectorService.addTaskToReceive(dto);
    return {"message": `задача на тестовую отправку сообщения направлена`}
  }

  @Post('/task_task_status_changing')
  @UseGuards(SecretKeyGuard)
  testTaskStatusChanging(@Body() updateTaskStatusDto: UpdateTaskStatusDto){
    this.connectorService.testTaskStatusChanging(updateTaskStatusDto);
    return {"message": `заявка на изменение статуса направлена`}
  }

  // @EventPattern('upload_data')
  // testReviewData(@Body() data) {
  //   console.log(data)
  //   return this.connectorService.test();
  // }
}
