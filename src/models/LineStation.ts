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
  @Column({
    unique: "line_station_order_unique",
    allowNull: false
  })
  lineId!: number;

  @ForeignKey(() => Station)
  @Column({
    allowNull: false
  })
  stationId!: number;

  @Column({
    unique: "line_station_order_unique",
    allowNull: false
  })
  stationOrder!: number;

  @BelongsToMany(() => Train, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    foreignKey: {
      name: 'line_station_id',
      unique: false
    }
  })
  trains?: Array<Train & { LineStationTrain: LineStationTrain }>;

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineStationTrain,
      unique: false,
      foreignKey: {
        name: 'line_station_id',
        unique: false
      }
    }
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
