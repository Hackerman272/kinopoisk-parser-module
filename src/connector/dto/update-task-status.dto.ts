import {ApiProperty} from "@nestjs/swagger";
import {IsNumber} from "class-validator";
import { taskStatus } from "../uploading-tasks.schema";

export class UpdateTaskStatusDto {
  @ApiProperty({example: "149jn-34nf4-3jndj", description: "Внутренний id строкой"})
  @IsNumber()
  readonly parserInternalId: string

  @ApiProperty({example: "processed или failed", description: "статус обработки"})
  @IsNumber()
  readonly taskStatus: taskStatus
}
