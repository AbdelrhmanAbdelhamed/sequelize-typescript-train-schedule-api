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
  Scopes,
  Index
} from "sequelize-typescript";
import { DataTypes, col } from "sequelize";

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
      attributes: ['id', 'day'],
      include: [
        {
          model: Train,
          attributes: ['id', 'number'],
          required: includeConditions,
          include: [
            {
              model: User,
              attributes: ['id', 'fullName'],
              required: includeConditions,
              through: {
                attributes: ['userId'],
                where: conditions
              }
            }
          ]
        },
        {
          model: PolicePerson,
          attributes: ['id', 'name', 'phoneNumber'],
          through: {
            attributes: ['fromStationId', 'toStationId']
          },
          include: [
            {
              model: Rank,
              attributes: ['id', 'name']
            },
            {
              model: PoliceDepartment,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [[col('day'), 'DESC']]
    };
  }
}))

@Table({
  underscored: true
})
export class TrainRun extends Model<TrainRun> {

  @AllowNull(false)
  @Index({
    order: 'DESC',
  })
  @Column({
    type: DataTypes.DATEONLY
  })
  day!: Date;

  @ForeignKey(() => Train)
  @AllowNull(false)
  @Column
  trainId!: number;

  @BelongsTo(() => Train)
  train?: Train;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

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
