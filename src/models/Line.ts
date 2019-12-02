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
import { LineStationTrain } from "./LineStationTrain";
@Table({
  underscored: true
})
export class Line extends Model<Line> {

  @Unique
  @Column
  name!: string;

  @BelongsToMany(() => Station, () => LineStation)
  stations?: Array<Station & { LineStation: LineStation }>;
  
  @BelongsToMany(() => Train, {
    through: {
      model: () => LineStationTrain,
      unique: false,
      foreignKey: 'line_id'
    }
  })
  trains?: Array<Train & {LineStationTrain: LineStationTrain}>;

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
