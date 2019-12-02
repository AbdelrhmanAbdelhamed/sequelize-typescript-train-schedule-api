import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  HasMany,
  Sequelize,
  Unique
} from "sequelize-typescript";

import { PolicePerson } from "./PolicePerson";
import { User } from "./User";

@Table({
  underscored: true
})
export class PoliceDepartment extends Model<PoliceDepartment> {

  @Unique
  @Column
  name!: string;

  @HasMany(() => PolicePerson)
  policePeople?: PolicePerson[];

  @HasMany(() => User)
  users?: User[];

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
