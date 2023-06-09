import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParsedEntityDocument = HydratedDocument<ParsedEntity>;

export enum entityStatus {
  WaitForParsing = "waitForParsing",
  Parsing = "parsing",
  Parsed = "parsed",
  UploadingToReceiver = "uploadingToReceiver",
  UploadedToReceiver = "uploadedToReceiver",
  NotFound = "notFound"
}

export enum entityType {
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
