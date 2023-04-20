import { Body, Controller, Post } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { CreateTaskDto } from "./dto/create-task.dto";
import { ConnectorService } from "./connector.service";
import { NewParserDto } from "../parser/dto/new-parser.dto";

@Controller('connector')
export class ConnectorController {
  constructor(private connectorService: ConnectorService) {
  }
  @EventPattern('create_uploading_task')
  createUploadingTask(@Body() createTaskDto: CreateTaskDto) {
    return this.connectorService.produceUploadingTask(createTaskDto);
  }

  @Post('/add_task')
  addTaskToReceive(@Body() dto: CreateTaskDto){
    this.connectorService.addTaskToReceive(dto);
    return {"message": `задача на тестовую отправку сообщения направлена`}
  }

  @EventPattern('upload_data')
  testReviewData(@Body() data) {
    console.log(data)
    return this.connectorService.testReviewData();
  }
}
