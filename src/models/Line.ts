import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  BelongsToMany,
  HasMany,
  Sequelize,
  Unique
} from "sequelize-typescript";

import { Station } from "./Station";
import { LineStation } from "./LineStation";
import { Train } from "./Train";

@Table({
  underscored: true
})
export class Line extends Model<Line> {

  @Unique
  @Column
  name!: string;

  @BelongsToMany(() => Station, () => LineStation)
  stations?: Array<Station & { LineStation: LineStation }>;

  @HasMany(() => Train)
  trains?: Train[];

  @CreatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  createdAt?: Date;

  @UpdatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  UpdatedAt?: Date;

}
