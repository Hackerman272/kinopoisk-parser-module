import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParsedEntityDocument = HydratedDocument<ParsedEntity>;

enum entityStatus {
  WaitForParsing = "waitForParsing",
  Parsing = "parsing",
  Parsed = "parsed",
  UploadedToReceiver = "uploadedToReceiver",
  NotFound = "notFound"
}

enum entityType {
  Person = "person",
  Film = "film",
  Review = "review"
}

@Schema()
export class ParsedEntity {
  @Prop()
  entityKinopoiskId: number;

  @Prop(({ type: {} }))
  entityJSON: {};

  @Prop()
  entityType: entityType;

  @Prop()
  status: entityStatus;
}

export const ParsedEntitySchema = SchemaFactory.createForClass(ParsedEntity);
