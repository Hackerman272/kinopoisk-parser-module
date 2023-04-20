import {ApiProperty} from "@nestjs/swagger";
import {IsNumber} from "class-validator";
import { taskEntityType } from "../uploading-tasks.schema";

export class CreateTaskDto {
  @ApiProperty({example: 100500, description: "Количество сущностей для получения каждого типа"})
  @IsNumber()
  readonly entitiesAmount: number

  @ApiProperty({example: "149jn-34nf4-3jndj", description: "Внешний id строкой"})
  @IsNumber()
  readonly externalId: string

  @ApiProperty({example: "all", description: "тип нужных сущностей"})
  @IsNumber()
  readonly entityType: taskEntityType
}
