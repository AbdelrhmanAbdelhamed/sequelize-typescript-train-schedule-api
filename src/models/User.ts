import * as bcrypt from "bcryptjs";

import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  Sequelize,
  Unique,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Role } from "./Role";
import { UserTrain } from "./UserTrain";
import { Train } from "./Train";

@Table({
  underscored: true
})
export class User extends Model<User> {

  @Column
  fullName!: string;

  @Unique
  @Column
  username!: string;

  @Column
  password!: string;

  @ForeignKey(() => Role)
  @Column
  roleId!: number;

  @BelongsTo(() => Role)
  role?: Role;

  @BelongsToMany(() => Train, () => UserTrain)
  trains?: Array<Train & { userTrain: UserTrain }>;

  @CreatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  createdAt?: Date;

  @UpdatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  updatedAt?: Date;

  token!: string;

  static async hashPassword(password) {
    const HASH_SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(password, HASH_SALT_ROUNDS);
    return hashedPassword;
  }

  validPassword(password) {
    return bcrypt.compare(password, this.password);
  }

}
