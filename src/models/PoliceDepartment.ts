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

@Table({
  underscored: true
})
export class PoliceDepartment extends Model<PoliceDepartment> {

  @Unique
  @Column
  name!: string;

  @HasMany(() => PolicePerson)
  policePeople?: PolicePerson[];

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
