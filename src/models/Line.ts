import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  BelongsToMany,
  Sequelize,
  Unique
} from "sequelize-typescript";

import { Station } from "./Station";
import { LineStation } from "./LineStation";
import { Train } from "./Train";
import { LineTrainStation } from "./LineTrainStation";
@Table({
  underscored: true
})
export class Line extends Model<Line> {

  @Unique
  @Column
  name!: string;

  @BelongsToMany(() => Station, {
    through: {
      model: () => LineStation,
      unique: false
    },
    foreignKey: 'line_id'
  })
  stations?: Array<Station & { LineStation: LineStation }>;

  @BelongsToMany(() => Train, {
    through: {
      model: () => LineTrainStation,
      unique: false
    },
    foreignKey: 'line_id'
  })
  trains?: Array<Train & {LineTrainStation: LineTrainStation}>;

  @CreatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  createdAt?: Date;

  @UpdatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  updatedAt?: Date;

}
