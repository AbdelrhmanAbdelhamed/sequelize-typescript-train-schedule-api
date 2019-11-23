import { Sequelize } from 'sequelize-typescript';

export const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USERNAME!, process.env.DB_PASSWORD!, {
  host:  process.env.DB_HOST,
  port: process.env.DB_PORT as any,
  dialect: process.env.DB_DIALECT as any,
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
