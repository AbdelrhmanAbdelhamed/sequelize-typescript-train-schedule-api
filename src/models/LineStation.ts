import {
  Index,
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
import { LineTrainStation } from "./LineTrainStation";
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

  @Index({
    order: 'ASC',
  })
  // tslint:disable-next-line: variable-name
  station_order!: number;

  @Column({
    unique: "line_station_order_unique",
    allowNull: false
  })
  stationOrder!: number;

  @BelongsToMany(() => Train, {
    through: {
      model: () => LineTrainStation,
      unique: false
    },
    foreignKey: 'line_station_id'
  })
  trains?: Array<Train & { LineTrainStation: LineTrainStation }>;

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineTrainStation,
      unique: false
    },
    foreignKey: 'line_station_id'
  })
  lines?: Array<Line & { LineTrainStation: LineTrainStation }>;

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
