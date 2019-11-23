import * as bcrypt from "bcryptjs";

import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  Sequelize,
  Unique,
} from "sequelize-typescript";

@Table({
  underscored: true
})
export class User extends Model<User> {

  @Unique
  @Column
  username!: string;

  @Column
  password!: string;

  @Column({
    defaultValue: false
  })
  isAdmin!: boolean;

  @CreatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  })
  createdAt?: Date;

  @UpdatedAt
  @Column({
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  UpdatedAt?: Date;

  token!: string;

  static async hashPassword(password) {
      const hashedPassword = await bcrypt.hash(password, process.env.HASH_SALT_ROUNDS!);
      return hashedPassword;
  }

  validPassword(password) {
    return bcrypt.compare(password, this.password);
  }

}
