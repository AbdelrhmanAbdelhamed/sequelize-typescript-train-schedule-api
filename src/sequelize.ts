import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

export const sequelize = new Sequelize("train_schedule", "tamer_soliman", "A.dmin@123", {
  operatorsAliases: { $and: Op.and, $or: Op.or, $not: Op.not },
  host:  "localhost",
  port: 3306,
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // tslint:disable-next-line: no-console
  logging: false,
  models: [__dirname + '/models']
});
