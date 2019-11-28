import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  UpdatedAt,
  Sequelize,
  BelongsTo,
  BelongsToMany
} from "sequelize-typescript";

import { Rank } from "./Rank";
import { PoliceDepartment } from "./PoliceDepartment";
import { TrainRun } from "./TrainRun";
import { TrainRunPolicePerson } from "./TrainRunPolicePerson";

@Table({
  underscored: true
})
export class PolicePerson extends Model<PolicePerson> {

  @Column
  name!: string;

  @Column
  phoneNumber!: string;

  @ForeignKey(() => Rank)
  @Column
  rankId!: number;

  @ForeignKey(() => PoliceDepartment)
  @Column
  policeDepartmentId!: number;

  @BelongsTo(() => Rank)
  rank!: Rank;

  @BelongsTo(() => PoliceDepartment)
  policeDepartment!: PoliceDepartment;

  @BelongsToMany(() => TrainRun, () => TrainRunPolicePerson)
  trainRuns?: Array<TrainRun & { TrainRunPolicePerson: TrainRunPolicePerson }>;

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
