import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParserCounterDocument = HydratedDocument<EntitiesCounter>;


@Schema()
export class EntitiesCounter {
  @Prop()
  lastParsedFilmId: number;

  @Prop()
  lastParsedPersonId: number;
}

export const ParserCounterSchema = SchemaFactory.createForClass(EntitiesCounter);
