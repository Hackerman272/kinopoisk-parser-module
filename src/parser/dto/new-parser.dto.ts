import {ApiProperty} from "@nestjs/swagger";
import {IsEmail, IsNumber, IsOptional, IsString, Length} from "class-validator";

enum EntityName {
  film = "film",
  person = "person"
}

export class NewParserDto {
  @ApiProperty({example: 123, description: "Количество сущностей для парсинга"})
  @IsNumber()
  readonly entitiesAmount: number

  @ApiProperty({example: 123, description: "id фильма для старта"})
  @IsNumber()
  @IsOptional()
  readonly startFilmId: number

  @ApiProperty({example: 600, description: "задержка в мс между запросами на парсинг 1 сущности"})
  @IsNumber()
  @IsOptional()
  readonly requestsDelay: number

  // нет необходимости, всегда лучше брать персон по конкретным фильмам, чтобы не забивать БД персонами без фильмов в БД
  // @ApiProperty({example: 'film', description: "Вид страницы для парсинга"})
  // @IsString({message: "Должна быть строка"})
  // readonly entity: EntityName;
}
