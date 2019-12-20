import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { TrainRun } from './models/TrainRun';
import * as trackRevisions from 'sequelize-logbook';

export const sequelize: Sequelize &
{
  whoDunnit?: string;
} = new Sequelize(process.env.DB_NAME!, process.env.DB_USERNAME!, process.env.DB_PASSWORD!, {
  operatorsAliases: { $and: Op.and, $or: Op.or, $not: Op.not },
  host:  process.env.DB_HOST,
  port:  process.env.DB_PORT as any,
  dialect: process.env.DB_DIALECT as any,
  define: { charset: 'utf8'},
  dialectOptions: { charset: 'utf8_general_ci' },
  timezone: "Africa/Cairo",
  pool: {
    max: 100,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // tslint:disable-next-line: no-console
  logging: console.log,
  models: [__dirname + '/models']
});

export const TrainRunRevision: any = trackRevisions(TrainRun);
