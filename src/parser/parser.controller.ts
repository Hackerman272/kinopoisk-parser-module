import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { NewParserDto } from "./dto/new-parser.dto";
import { ParserService } from "./parser.service";
import { SecretKeyGuard } from "../guards/secret-key.guard";

@ApiTags('Парсеры')
@Controller('parser')
export class ParserController {
  constructor(private parserService: ParserService) {
  }
  @ApiOperation({summary: "Парсим кинопоиск"})
  @ApiResponse({status: 200})
  @Post('/parse')
  @UseGuards(SecretKeyGuard)
  addRole(@Body() dto: NewParserDto){
    this.parserService.parseSomeNumberEntities(dto);
    return {"message": `задача на парсинг принята в работу`}
  }
}
