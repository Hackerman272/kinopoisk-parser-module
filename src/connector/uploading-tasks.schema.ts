import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UploadingTaskDocument = HydratedDocument<UploadingTask>;

export enum taskStatus {
  Received = "received",
  Processing = "processing",
  Processed = "processed",
  Failed = "failed"
}

export enum taskEntityType {
  All = "all",
  Film = "film",
  Review = "review",
  Person = "person"
}

@Schema()
export class UploadingTask {
  @Prop()
  taskInternalId: string;

  @Prop()
  taskExternalId: string;

  @Prop()
  entitiesAmount: number;

  @Prop()
  taskEntityType: taskEntityType;

  @Prop()
  taskStatus: taskStatus;

  @Prop()
  processingFilmsId: []

  @Prop()
  processingReviewsId: []

  @Prop()
  processingPersonsId: []
}

export const UploadingTaskSchema = SchemaFactory.createForClass(UploadingTask);
