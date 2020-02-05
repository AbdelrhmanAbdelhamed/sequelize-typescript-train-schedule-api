import {
  Column,
  CreatedAt,
  Model,
  Table,
  HasMany,
  UpdatedAt,
  Sequelize,
  Unique,
  BelongsToMany,
  Scopes,
} from "sequelize-typescript";

import { TrainRun } from "./TrainRun";
import { LineStation } from "./LineStation";
import { LineStationTrain } from "./LineStationTrain";
import { Line } from "./Line";
import { User } from "./User";
import { UserTrain } from "./UserTrain";
import toSequelizeQuery from "../utils/toSequelizeQuery";
import isEmpty from "../utils/isEmpty";

@Scopes(() => ({
  accessibleBy: (ability, action = 'read') => {
    const conditions = toSequelizeQuery(ability, 'UserTrain', action);
    const includeConditions = !isEmpty(conditions);
    return {
      attributes: ['id', 'number'],
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
      };
  }
}))

@Table({
  underscored: true
})
export class Train extends Model<Train> {

  @Unique
  @Column
  number!: string;

  @HasMany(() => TrainRun)
  trainRuns?: TrainRun;

  @BelongsToMany(() => LineStation, {
    through: {
      model: () => LineStationTrain,
      unique: false
    }
  })
  lineStations?: Array<LineStation & { LineStationTrain: LineStationTrain }>;

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineStationTrain,
      unique: false
    },
    foreignKey: 'train_id'
  })
  lines?: Array<Line & { LineStationTrain: LineStationTrain }>;

  @BelongsToMany(() => User, () => UserTrain)
  users?: Array<User & { userTrain: UserTrain }>;

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
