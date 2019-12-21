import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { TrainRun } from './models/TrainRun';
import * as trackRevisions from 'sequelize-logbook';

export const sequelize: Sequelize &
{
  whoDunnit?: string;
} = new Sequelize("train_schedule", "tamer_soliman", "A.dmin@123", {
  operatorsAliases: { $and: Op.and, $or: Op.or, $not: Op.not },
  host:  "localhost",
  port: 3306,
  dialect: "mysql",
  define: { charset: "utf8"},
  dialectOptions: { charset: "utf8_general_ci" },
  timezone: "Africa/Cairo",
  pool: {
    max: 100,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // tslint:disable-next-line: no-console
  logging: false,
  models: [__dirname + "/models"]
});

export const TrainRunRevision: any = trackRevisions(TrainRun, {indexes: [
  {
    fields: ['train_id'],
  },
]});
