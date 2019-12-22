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
  AllowNull,
  Scopes
} from "sequelize-typescript";
import { DataTypes } from "sequelize";

import { Train } from "./Train";
import { TrainRunPolicePerson } from "./TrainRunPolicePerson";
import { PolicePerson } from "./PolicePerson";
import toSequelizeQuery from "../utils/toSequelizeQuery";
import { Rank } from "./Rank";
import { PoliceDepartment } from "./PoliceDepartment";
import { User } from "./User";
import isEmpty from "../utils/isEmpty";

@Scopes(() => ({
  accessibleBy: (ability, action = 'read') => {
    const conditions = toSequelizeQuery(ability, 'UserTrain', action);
    const includeConditions = !isEmpty(conditions);
    return {
      include: [
        {
          model: Train,
          required: includeConditions,
          include: [
            {
              model: User,
              required: includeConditions,
              through: {
                where: conditions
              }
            }
          ]
        },
        {
          model: PolicePerson,
          include: [Rank, PoliceDepartment]
        }
      ]
    };
  }
}))

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
