import {
  Column,
  CreatedAt,
  Model,
  Table,
  HasMany,
  UpdatedAt,
  Sequelize,
  Unique,
  BelongsToMany,
} from "sequelize-typescript";

import { TrainRun } from "./TrainRun";
import { LineStation } from "./LineStation";
import { LineStationTrain } from "./LineStationTrain";
import { Line } from "./Line";

@Table({
  underscored: true
})
export class Train extends Model<Train> {

  @Unique
  @Column
  number!: string;

  @HasMany(() => TrainRun)
  trainRuns?: TrainRun;

  @BelongsToMany(() => LineStation, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    constraints: false
  })
  lineStations?: Array<LineStation & { LineStationTrain: LineStationTrain }>;

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    constraints: false
  })
  lines?: Array<Line & { LineStationTrain: LineStationTrain }>;

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
