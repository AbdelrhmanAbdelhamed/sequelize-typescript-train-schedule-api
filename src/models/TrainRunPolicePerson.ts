import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  UpdatedAt,
  Sequelize
} from "sequelize-typescript";

import { TrainRun } from "./TrainRun";
import { PolicePerson } from "./PolicePerson";
import { Station } from "./Station";

@Table({
  underscored: true
})
export class TrainRunPolicePerson extends Model<TrainRunPolicePerson> {

  @ForeignKey(() => TrainRun)
  @Column
  trainRunId!: number;

  @ForeignKey(() => PolicePerson)
  @Column
  policePersonId!: number;

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
