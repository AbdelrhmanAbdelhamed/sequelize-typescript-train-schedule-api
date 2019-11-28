import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  UpdatedAt,
  Sequelize,
  BelongsToMany
} from "sequelize-typescript";

import { Line } from "./Line";
import { Station } from "./Station";
import { LineStationTrain } from "./LineStationTrain";
import { Train } from "./Train";
import { DataTypes } from "sequelize";

@Table({
  underscored: true
})
export class LineStation extends Model<LineStation> {

  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id!: number;

  @ForeignKey(() => Line)
  @Column
  lineId!: number;

  @ForeignKey(() => Station)
  @Column
  stationId!: number;

  @Column({
    unique: "line_stations_stationId_lineId_unique"
  })
  stationOrder!: number;

  @BelongsToMany(() => Train, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    constraints: false
  })
  trains?: Array<Train & {LineStationTrain: LineStationTrain}>;
  

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    constraints: false
  })
  lines?: Array<Line & {LineStationTrain: LineStationTrain}>;

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
