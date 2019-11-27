import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  UpdatedAt,
  Sequelize
} from "sequelize-typescript";

import { Line } from "./Line";
import { Station } from "./Station";

@Table({
  underscored: true
})
export class LineStation extends Model<LineStation> {

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
