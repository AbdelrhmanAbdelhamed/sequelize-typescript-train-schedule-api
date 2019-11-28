import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  Sequelize,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  AllowNull
} from "sequelize-typescript";
import { DataTypes } from "sequelize";

import { Train } from "./Train";
import { TrainRunPolicePerson } from "./TrainRunPolicePerson";
import { PolicePerson } from "./PolicePerson";

@Table({
  underscored: true
})
export class TrainRun extends Model<TrainRun> {

  @AllowNull(false)
  @Column({
    type: DataTypes.DATEONLY,
    unique: "train_run_date"
  })
  day!: Date;

  @ForeignKey(() => Train)
  @AllowNull(false)
  @Column({
    unique: "train_run_date"
  })
  trainId!: number;

  @BelongsTo(() => Train)
  train?: Train;

  @BelongsToMany(() => PolicePerson, () => TrainRunPolicePerson)
  policePeople?: Array<PolicePerson & { TrainRunPolicePerson: TrainRunPolicePerson }>;

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
