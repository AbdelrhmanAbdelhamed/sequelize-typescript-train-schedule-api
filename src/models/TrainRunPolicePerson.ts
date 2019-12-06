import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  UpdatedAt,
  Sequelize,
  BelongsTo
} from "sequelize-typescript";

import { TrainRun } from "./TrainRun";
import { PolicePerson } from "./PolicePerson";
import { Station } from "./Station";

@Table({
  underscored: true
})
export class TrainRunPolicePerson extends Model<TrainRunPolicePerson> {

  @ForeignKey(() => TrainRun)
  @Column({
    allowNull: false
  })
  trainRunId!: number;

  @ForeignKey(() => PolicePerson)
  @Column({
    allowNull: false
  })
  policePersonId!: number;

  @ForeignKey(() => Station)
  @Column({
    allowNull: false
  })
  fromStationId!: number;

  @ForeignKey(() => Station)
  @Column({
    allowNull: false
  })
  toStationId!: number;

  @BelongsTo(() => Station, { foreignKey: 'fromStationId', as: 'fromStation' })
  fromStation!: Station;

  @BelongsTo(() => Station, { foreignKey: 'toStationId', as: 'toStation' })
  toStation!: Station;

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
