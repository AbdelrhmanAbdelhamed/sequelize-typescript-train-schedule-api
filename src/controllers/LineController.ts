import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Patch, Delete, Use } from 'decorate-express';

import { Line } from "../models/Line";
import { Train } from '../models/Train';
import { Station } from '../models/Station';
import { TrainRun } from '../models/TrainRun';
import { PolicePerson } from '../models/PolicePerson';
import { Rank } from '../models/Rank';
import { PoliceDepartment } from '../models/PoliceDepartment';
import validateUser from '../middlewares/ValidateUser';
import { literal } from 'sequelize';
import { User } from '../models/User';

@BasePath('/api/lines')
export default class LineController {

  @Use()
  validateUser(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const line = await Line.create(req.body);
      res.status(201).json(line);
    } catch (e) {
      next(e);
    }
  }

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const lines: any[] = await Line.findAll({
        include: [Station, {
          model: Train,
          include: [
            {
              model: TrainRun,
              include: [
                {
                  model: PolicePerson,
                  include: [Rank, PoliceDepartment]
                }
              ]
            }
          ]
        }],
        order: [[literal('`stations.LineStation.stationOrder`'), 'ASC']]
      });

      let linesWithTrainRunsStations: any = lines;
      if (lines && lines.length > 0) {
        linesWithTrainRunsStations = await Promise.all(lines.map(async line => {
          let lineTrainsRunsStations: any = [];
          let lineWithTrainRunsStaions: any = line;
          if (line && line.trains && line.trains.length > 0) {
            lineTrainsRunsStations = await Promise.all(line.trains.map(async train => {
              if (train) {
                const policePeopleStations: any = await Promise.all(train.trainRuns!.map(async trainRun => {
                  return await Promise.all(trainRun.policePeople!.map((policePerson: any) => {
                    return [Station.findByPk(policePerson.TrainRunPolicePerson.fromStationId),
                    Station.findByPk(policePerson.TrainRunPolicePerson.toStationId)
                    ]
                  }).map(Promise.all, Promise));
                }));
                const trainRunsWithStations: any = train.trainRuns.map((trainRun, index) => {
                  const fromStation = policePeopleStations[index][0][0];
                  const toStation = policePeopleStations[index][0][1];
                  const policePeopleWithStations = trainRun.policePeople!.map(policePerson => {
                    return {
                      createdAt: policePerson.createdAt,
                      id: policePerson.id,
                      name: policePerson.name,
                      phoneNumber: policePerson.phoneNumber,
                      policeDepartment: {
                        createdAt: policePerson.policeDepartment.createdAt,
                        id: policePerson.policeDepartment.id,
                        name: policePerson.policeDepartment.name,
                        updatedAt: policePerson.policeDepartment.updatedAt
                      },
                      policeDepartmentId: policePerson.policeDepartmentId,
                      rank: {
                        createdAt: policePerson.rank.createdAt,
                        id: policePerson.rank.id,
                        name: policePerson.rank.name,
                        updatedAt: policePerson.rank.updatedAt
                      },
                      rankId: policePerson.rankId,
                      updatedAt: policePerson.updatedAt,
                      TrainRunPolicePerson: {
                        createdAt: policePerson.TrainRunPolicePerson.createdAt,
                        fromStationId: policePerson.TrainRunPolicePerson.fromStationId,
                        policePersonId: policePerson.TrainRunPolicePerson.policePersonId,
                        toStationId: policePerson.TrainRunPolicePerson.toStationId,
                        trainRunId: policePerson.TrainRunPolicePerson.trainRunId,
                        updatedAt: policePerson.TrainRunPolicePerson.updatedAt,
                        fromStation: fromStation,
                        toStation: toStation
                      }
                    }
                  })
                  return {
                    createdAt: trainRun.createdAt,
                    day: trainRun.day,
                    id: trainRun.id,
                    policePeople: policePeopleWithStations,
                    trainId: trainRun.trainId,
                    updatedAt: trainRun.updatedAt
                  }
                })

                return {
                  createdAt: train.createdAt,
                  id: train.id,
                  lineStations: train.lineStations,
                  lines: train.lines,
                  number: train.number,
                  trainRuns: trainRunsWithStations,
                  updatedAt: train.updatedAt
                }
              }
            }));

            lineWithTrainRunsStaions = {
              createdAt: line.createdAt,
              id: line.id,
              name: line.name,
              stations: line.stations,
              trains: lineTrainsRunsStations,
              updatedAt: line.updatedAt
            }
          }
          return lineWithTrainRunsStaions;
        }));
      }
      res.json(linesWithTrainRunsStations);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const line = await Line.findByPk(req.params.id, {
        include: [Station, {
          model: Train,
          include: [
            {
              model: TrainRun,
              include: [
                {
                  model: PolicePerson,
                  include: [Rank, PoliceDepartment]
                }
              ]
            }
          ]
        }],
        order: [[literal('`stations.LineStation.stationOrder`'), 'ASC']]
      });

      let lineTrainsRunsStations = [];
      let lineWithTrainRunsStaions = line;
      if (line && line.trains && line.trains.length > 0) {
        lineTrainsRunsStations = await Promise.all(line.trains.map(async train => {
          if (train) {
            const policePeopleStations: any = await Promise.all(train.trainRuns.map(async trainRun => {
              return await Promise.all(trainRun.policePeople!.map((policePerson: any) => {
                return [Station.findByPk(policePerson.TrainRunPolicePerson.fromStationId),
                Station.findByPk(policePerson.TrainRunPolicePerson.toStationId)
                ]
              }).map(Promise.all, Promise));
            }));
            const trainRunsWithStations: any = train.trainRuns.map((trainRun, index) => {
              const fromStation = policePeopleStations[index][0][0];
              const toStation = policePeopleStations[index][0][1];
              const policePeopleWithStations = trainRun.policePeople!.map(policePerson => {
                return {
                  createdAt: policePerson.createdAt,
                  id: policePerson.id,
                  name: policePerson.name,
                  phoneNumber: policePerson.phoneNumber,
                  policeDepartment: {
                    createdAt: policePerson.policeDepartment.createdAt,
                    id: policePerson.policeDepartment.id,
                    name: policePerson.policeDepartment.name,
                    updatedAt: policePerson.policeDepartment.updatedAt
                  },
                  policeDepartmentId: policePerson.policeDepartmentId,
                  rank: {
                    createdAt: policePerson.rank.createdAt,
                    id: policePerson.rank.id,
                    name: policePerson.rank.name,
                    updatedAt: policePerson.rank.updatedAt
                  },
                  rankId: policePerson.rankId,
                  updatedAt: policePerson.updatedAt,
                  TrainRunPolicePerson: {
                    createdAt: policePerson.TrainRunPolicePerson.createdAt,
                    fromStationId: policePerson.TrainRunPolicePerson.fromStationId,
                    policePersonId: policePerson.TrainRunPolicePerson.policePersonId,
                    toStationId: policePerson.TrainRunPolicePerson.toStationId,
                    trainRunId: policePerson.TrainRunPolicePerson.trainRunId,
                    updatedAt: policePerson.TrainRunPolicePerson.updatedAt,
                    fromStation: fromStation,
                    toStation: toStation
                  }
                }
              })
              return {
                createdAt: trainRun.createdAt,
                day: trainRun.day,
                id: trainRun.id,
                policePeople: policePeopleWithStations,
                trainId: trainRun.trainId,
                updatedAt: trainRun.updatedAt
              }
            })

            return {
              createdAt: train.createdAt,
              id: train.id,
              lineStations: train.lineStations,
              lines: train.lines,
              number: train.number,
              trainRuns: trainRunsWithStations,
              updatedAt: train.updatedAt
            }
          }
        }));

        lineWithTrainRunsStaions = {
          createdAt: line.createdAt,
          id: line.id,
          name: line.name,
          stations: line.stations,
          trains: lineTrainsRunsStations,
          updatedAt: line.updatedAt
        }
      }

      res.json(lineWithTrainRunsStaions);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id/stations')
  async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const stations = await Station.findAll({
        include: [{
          model: Line,
          where: { id: req.params.id },
          include: [{
            model: Train,
            include: [{
              model: TrainRun,
              include: [{
                model: PolicePerson,
                include: [Rank, PoliceDepartment]
              }]
            }]
          }]
        }],
        order: [[literal('`lines.LineStation.stationOrder`'), 'ASC']]
      });
      res.json(stations);
    } catch (e) {
      next(e);
    }
  }

  @Patch('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await Line.update(req.body, {
        where: {
          id: req.params.id
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Delete('/:id')
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await Line.destroy({
        where: {
          id: req.params.id
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }
}
