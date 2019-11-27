import { Sequelize } from 'sequelize-typescript';

export const sequelize = new Sequelize("train_schedule_test", "tamer_soliman", "A.dmin@123", {
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
  logging: console.log,
  models: [__dirname + '/models']
});
