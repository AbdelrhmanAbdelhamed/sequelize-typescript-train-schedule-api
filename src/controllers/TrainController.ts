import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Get, Patch, Delete, Use, Put } from "decorate-express";

import { Train } from "../models/Train";
import { TrainRun } from "../models/TrainRun";
import { PolicePerson } from "../models/PolicePerson";
import { Rank } from "../models/Rank";
import { PoliceDepartment } from "../models/PoliceDepartment";
import { Station } from "../models/Station";
import { LineStation } from "../models/LineStation";
import { LineStationTrain } from "../models/LineStationTrain";
import { Line } from "../models/Line";
import { QueryTypes, col, Transaction, literal } from "sequelize";
import validateUser from "../middlewares/ValidateUser";
import { User } from "../models/User";

import { sequelize, TrainRunRevision } from "../sequelize";

import { rulesToFields } from "@casl/ability/extra";
import isEmpty from "../utils/isEmpty";
import mergeObjectsKeyIntoArray from "../utils/mergeObjectsKeyIntoArray";
import joinObject from "../utils/joinObject";

@BasePath("/api/trains")
export default class TrainController {
  @Use()
  validateUser(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { number, stations } = req.body;
      const [train] = await Train.findOrCreate({ where: { number } });
      if (stations) {
        await Promise.all(stations.map(station => {
          return train.$add("lineStation", station.lineStationId, {
            through: {
              ...station.LineStationTrain
            }
          });
        }));
      }
      res.status(201).json(train);
    } catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Post("/:id/runs")
  async addRun(req: Request, res: Response, next: NextFunction) {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const train: Train = await Train.findByPk(req.params.id, { transaction });
      if (train) {
        const { policePeople } = req.body;
        const policePeopleData: any = await Promise.all(
          await policePeople
            .map(policePerson => {
              const { rank, policeDepartment } = policePerson;
              return [
                PoliceDepartment.findOrCreate({
                  where: { name: policeDepartment.name },
                  transaction
                }),
                Rank.findOrCreate({
                  where: { name: rank.name },
                  transaction
                })
              ];
            })
            .map(Promise.all, Promise)
        );

        const resultPolicePeople: any = await Promise.all(
          policePeople.map((policePerson, index) => {
            const policeDepartmentId = policePeopleData[index][0][0].id;
            const rankId = policePeopleData[index][1][0].id;

            return PolicePerson.findOrCreate({
              where: {
                name: policePerson.name,
                rankId,
                policeDepartmentId,
                phoneNumber: policePerson.phoneNumber
              },
              transaction
            });
          })
        );

        const trainRun: TrainRun = await TrainRun.create(req.body, { transaction });
        await Promise.all(
          resultPolicePeople.map((resultPolicePerson, index) => {
            return trainRun.$add("policePerson", resultPolicePerson[0].id, {
              through: {
                fromStationId: policePeople[index].fromStationId,
                toStationId: policePeople[index].toStationId
              },
              transaction
            });
          })
        );
        await transaction.commit();
        res.status(201).json(trainRun);
      }
    } catch (e) {
      await transaction.rollback();
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Post("/:id/stations")
  async addStation(req: Request, res: Response, next: NextFunction) {
    try {
      const train: Train = await Train.findByPk(req.params.id);
      const stations = req.body;
      if (train) {
        if (stations) {
          await Promise.all(stations.map(station => {
            return train.$add("lineStation", station.lineStationId, {
              through: {
                ...station.LineStationTrain
              }
            });
          }));
        }
      }
      res.json(stations);
    } catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Delete("/:id/stations/:lineStationId")
  async deleteLineStation(req: Request, res: Response, next: NextFunction) {
    try {
      await LineStationTrain.destroy({
        where: {
          trainId: req.params.id,
          lineStationId: req.params.lineStationId
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Put("/:id/stations")
  async updateLineStations(req: Request, res: Response, next: NextFunction) {
    try {
      await Promise.all(req.body.map(station => {
        station.LineStationTrain.trainId = req.params.id;
        return LineStationTrain.upsert(station.LineStationTrain);
      }));
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Patch("/:id/stations/:lineStationId")
  async updateStation(req: Request, res: Response, next: NextFunction) {
    try {
      await LineStationTrain.update(req.body, {
        where: {
          trainId: req.params.id,
          lineStationId: req.params.lineStationId
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Delete("/:trainId/runs/:id")
  async deleteRun(req: Request, res: Response, next: NextFunction) {
    const transaction: Transaction = await sequelize.transaction();
    try {
      await TrainRun.destroy({
        where: {
          id: req.params.id,
          trainId: req.params.trainId
        },
        individualHooks: true,
        transaction
      });
      await transaction.commit();
      res.sendStatus(200);
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }

  @Get("/runs")
  async getAllTrainRuns(req: Request & { ability: any, User: any }, res: Response, next: NextFunction) {
    try {
      const trainRuns: TrainRun[] = await TrainRun.scope({ method: ['accessibleBy', req.ability] }).findAll();

      if (trainRuns) {
        const policePeopleStations: any = await Promise.all(trainRuns.map(async trainRun => {
          return Promise.all(trainRun.policePeople!.map((policePerson: any) => {
            return [Station.findByPk(policePerson.TrainRunPolicePerson.fromStationId),
            Station.findByPk(policePerson.TrainRunPolicePerson.toStationId)
            ];
          }).map(Promise.all, Promise));
        }));
        const trainRunsWithStations: any = trainRuns.map((trainRun, index) => {
          const fromStation = policePeopleStations[index][0][0];
          const toStation = policePeopleStations[index][0][1];
          const policePeopleWithStations: any = trainRun.policePeople!.map(policePerson => {
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
                fromStation,
                toStation
              }
            };
          });
          return {
            createdAt: trainRun.createdAt,
            day: trainRun.day,
            id: trainRun.id,
            policePeople: policePeopleWithStations,
            trainId: trainRun.trainId,
            updatedAt: trainRun.updatedAt,
            train: {
              createdAt: trainRun.train!.createdAt,
              id: trainRun.train!.id,
              number: trainRun.train!.number,
              updatedAt: trainRun.train!.updatedAt
            }
          };
        });
        res.json(trainRunsWithStations);
      }

    } catch (e) {
      next(e);
    }
  }

  @Get("/")
  async get(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    if (req.query.departureStation && req.query.arrivalStation) {
      this.getByStations(req, res, next);
    } else {
      this.getAll(req, res, next);
    }
  }

  @Get("/:id/runs")
  async getTrainRunsByTrainId(req: Request & { ability: any, user: any }, res: Response, next: NextFunction) {
    try {
      const trainRuns: TrainRun[] = await TrainRun.scope({ method: ['accessibleBy', req.ability] }).findAll({
        where: {
          trainId: req.params.id
        }
      });

      if (trainRuns && trainRuns.length > 0) {
        const policePeopleStations: any = await Promise.all(trainRuns.map(async trainRun => {
          return Promise.all(trainRun.policePeople!.map((policePerson: any) => {
            return [Station.findByPk(policePerson.TrainRunPolicePerson.fromStationId),
            Station.findByPk(policePerson.TrainRunPolicePerson.toStationId)
            ];
          }).map(Promise.all, Promise));
        }));
        const trainRunsWithStations: any = trainRuns.map((trainRun, index) => {
          const fromStation = policePeopleStations[index][0][0];
          const toStation = policePeopleStations[index][0][1];
          const policePeopleWithStations: any = trainRun.policePeople!.map(policePerson => {
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
                fromStation,
                toStation
              }
            };
          });
          return {
            createdAt: trainRun.createdAt,
            day: trainRun.day,
            id: trainRun.id,
            policePeople: policePeopleWithStations,
            trainId: trainRun.trainId,
            updatedAt: trainRun.updatedAt,
            train: {
              createdAt: trainRun.train!.createdAt,
              id: trainRun.train!.id,
              number: trainRun.train!.number,
              updatedAt: trainRun.train!.updatedAt
            }
          };
        });
        res.json(trainRunsWithStations);
      } else {
        const train = await Train.findByPk(req.params.id);
        if (train) {
          res.json({ train });
        }
      }

    } catch (e) {
      next(e);
    }
  }

  @Get("/runs/revisions")
    async getAllRunsRevisions(req: Request, res: Response, next: NextFunction) {
      try {
        const trainRunsRevisions = await TrainRunRevision.findAll({
          order: [[col('revisionValidFrom'), 'DESC'], [col('revisionValidTo'), 'DESC']]
        });
        const results = await Promise.all(trainRunsRevisions.map(async trainRunRevision => {
          const train = await Train.findByPk(trainRunRevision.trainId);
          return {train, item: trainRunRevision};
        }));
        res.json(results);
      } catch (e) {
        next(e);
      }
  }

  @Get("/:id/runs/revisions")
  async getRunsRevisionsByTrainId(req: Request, res: Response, next: NextFunction) {
    try {
      const trainRunRevisions = await TrainRunRevision.findAll({
        where: {
          trainId: req.params.id
        },
        order: [[col('revisionValidFrom'), 'DESC'], [col('revisionValidTo'), 'DESC']]
      });
      const train = await Train.findByPk(req.params.id);
      const results = {train, items: trainRunRevisions};
      res.json(results);
    } catch (e) {
      next(e);
    }
}

  @Get("/:id")
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const train = await Train.findByPk(req.params.id, {
        include: [
          Line,
          LineStation
        ]
      });
      res.json(train);

    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/stations/lines/:lineId")
  async getTrainLineStations(req: Request, res: Response, next: NextFunction) {
    try {
      const trains = await Train.findByPk(req.params.id, {
        include: [{
          model: LineStation,
          through: { where: { lineId: req.params.lineId } }
        }],
        order: [
          [literal('`lineStations.LineStationTrain.arrivalTime`'), 'ASC'],
          [literal('`lineStations.LineStationTrain.departureTime`'), 'ASC'],
          [literal('`lineStations.stationOrder`'), 'ASC']
        ]
      });
      const stations: any = await Promise.all(trains.lineStations.map(lineStation => {
        return Station.findByPk(lineStation.stationId);
      }));

      const lineStationTrains = trains.lineStations.map((lineStation, index) => {
        return {
          id: stations[index].id,
          name: stations[index].name,
          createdAt: stations[index].createdAt,
          updatedAt: stations[index].updatedAt,
          lineStationId: lineStation.id,
          LineStation: {
            id: lineStation.id,
            lineId: lineStation.lineId,
            stationId: lineStation.stationId,
            stationOrder: lineStation.stationOrder,
            createdAt: lineStation.createdAt,
            updatedAt: lineStation.updatedAt
          },
          LineStationTrain: {
            id: lineStation.LineStationTrain.id,
            trainId: lineStation.LineStationTrain.trainId,
            lineId: lineStation.LineStationTrain.lineId,
            lineStationId: lineStation.LineStationTrain.lineStationId,
            arrivalTime: lineStation.LineStationTrain.arrivalTime,
            departureTime: lineStation.LineStationTrain.departureTime,
            isArrival: lineStation.LineStationTrain.isArrival,
            isDeprature: lineStation.LineStationTrain.isDeprature,
            createdAt: lineStation.LineStationTrain.createdAt,
            updatedAt: lineStation.LineStationTrain.updatedAt
          }
        };
      });
      res.json(lineStationTrains);
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/lines")
  async getLines(req: Request, res: Response, next: NextFunction) {
    try {
      const train: Train = await Train.findByPk(req.params.id);
      let lines = [];
      if (train) {
       lines = await train.$get("lines", { group: "id" });
      }
      res.json(lines);
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/stations")
  async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const train: Train = await Train.findByPk(req.params.id, { include: [LineStation] });
      let stations;
      if (train && train.lineStations) {
        stations = await Promise.all(train.lineStations.map(async lineStation => {
          const stationItem = await Station.findByPk(lineStation.stationId);
          return {
            id: stationItem.id,
            name: stationItem.name,
            lineStationId: lineStation.id,
            createdAt: lineStation.createdAt,
            updatedAt: lineStation.updatedAt,
            LineStationTrain: {
              id: lineStation.LineStationTrain.id,
              arrivalTime: lineStation.LineStationTrain.arrivalTime,
              departureTime: lineStation.LineStationTrain.departureTime,
              isArrival: lineStation.LineStationTrain.isArrival,
              isDeprature: lineStation.LineStationTrain.isDeprature,
              createdAt: lineStation.LineStationTrain.createdAt,
              updatedAt: lineStation.LineStationTrain.updatedAt
            }
          };
        }));
      }
      res.json(stations);
    } catch (e) {
      next(e);
    }
  }

  @Patch("/:id")
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await Train.update(req.body, {
        where: {
          id: req.params["id"]
        }
      });
      res.sendStatus(200);
    }  catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Delete("/:id")
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await Train.destroy({
        where: {
          id: req.params.id
        }
      });
      res.sendStatus(200);
    } catch (e) {
      const ER_ROW_IS_REFERENCED_2 = "ER_ROW_IS_REFERENCED_2";
      if (e.original && e.original.code === ER_ROW_IS_REFERENCED_2) {
        res.sendStatus(400);
      } else {
        next(e);
      }
    }
  }

  @Delete("/:id/lines/:lineId")
  async deleteLine(req: Request, res: Response, next: NextFunction) {
    try {
      const lineTrainStations: any = await LineStationTrain.findAll({
        where: {
          trainId: req.params.id
        },
        group: [col('trainId'), col('lineId')]
      });

      if (lineTrainStations.length <= 1) {
        await Train.destroy({
          where: {
            id: req.params.id
          }
        });
      }
      await LineStationTrain.destroy({
        where: {
          trainId: req.params.id,
          lineId: req.params.lineId
        }
      });
      res.sendStatus(200);
    } catch (e) {
      const ER_ROW_IS_REFERENCED_2 = "ER_ROW_IS_REFERENCED_2";
      if (e.original && e.original.code === ER_ROW_IS_REFERENCED_2) {
        res.sendStatus(400);
      } else {
        next(e);
      }
    }
  }

  private async getByStations(req: Request & { ability: any, user: any }, res: Response, next: NextFunction) {
    try {
      const trains = await sequelize.query(
        `
        SELECT
        DISTINCT \`lines\`.id AS \`lines.id\`,
            Train.id,
            Train.number,
        users.id AS \`users.id\`,
        \`users->UserTrain\`.user_id AS \`users.UserTrain.userId\`,
        \`lines\`.name AS \`lines.name\`
            FROM
                trains AS Train
            LEFT OUTER JOIN
                (user_trains AS \`users->UserTrain\`
            INNER JOIN users AS \`users\` ON users.id = \`users->UserTrain\`.user_id
                                )
              ON Train.id = \`users->UserTrain\`.train_id
            LEFT OUTER JOIN
                (line_station_trains AS \`lines->LineStationTrain\`
            INNER JOIN \`lines\` AS \`lines\` ON \`lines\`.id = \`lines->LineStationTrain\`.line_id)
              ON Train.id = \`lines->LineStationTrain\`.train_id
        JOIN
                line_station_trains AS departure_line_station_trains ON departure_line_station_trains.train_id = Train.id
        JOIN
                line_station_trains arrival_line_station_trains ON arrival_line_station_trains.train_id = Train.id
        JOIN
                line_stations AS departure_line_station ON departure_line_station.id = departure_line_station_trains.line_station_id
        JOIN
                line_stations AS arrival_line_station ON arrival_line_station.id = arrival_line_station_trains.line_station_id
        JOIN
                stations AS departure_stations ON departure_stations.id = departure_line_station.station_id
        JOIN
                stations AS arrival_stations ON arrival_stations.id = arrival_line_station.station_id
            WHERE
                departure_stations.name = $departureStation
          AND departure_line_station_trains.is_deprature = 1
          AND arrival_stations.name = $arrivalStation
          AND arrival_line_station_trains.is_arrival = 1
          AND departure_line_station.station_order < arrival_line_station.station_order
        `,
        {
          bind: {
            departureStation: req.query.departureStation,
            arrivalStation: req.query.arrivalStation
          },
          model: Train,
          mapToModel: true,
          nest: true,
          raw: true,
          type: QueryTypes.SELECT
        }
      );
      res.json(mergeObjectsKeyIntoArray(trains, "lines"));
    } catch (e) {
      next(e);
    }
  }

  private async getAll(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    try {
      const conditions = rulesToFields(req.ability, "read", "UserTrain");
      const includeConditions = !isEmpty(conditions);
      const userTrainsJoinType = includeConditions ? 'INNER JOIN' : 'LEFT OUTER JOIN';
      const userJoinConditions = `users.id = \`users->UserTrain\`.user_id
                            ${
                              includeConditions
                              ?
                              'AND (`users->UserTrain`.' + joinObject(conditions, " = ", " OR ", "underscore") + ')'
                              : ''
                            }`;
      const trains = await sequelize.query(
        `
        SELECT
            DISTINCT \`lines\`.\`id\` AS \`lines.id\`,
            \`Train\`.\`id\`,
            \`Train\`.\`number\`,
            \`users\`.\`id\` AS \`users.id\`,
            \`users->UserTrain\`.\`user_id\` AS \`users.UserTrain.userId\`,
            \`lines\`.\`name\` AS \`lines.name\`
        FROM
            \`trains\` AS \`Train\`
        ${userTrainsJoinType}
            (\`user_trains\` AS \`users->UserTrain\`
        INNER JOIN \`users\` AS \`users\` ON ${userJoinConditions})
          ON \`Train\`.\`id\` = \`users->UserTrain\`.\`train_id\`
        LEFT OUTER JOIN
            (\`line_station_trains\` AS \`lines->LineStationTrain\`
        INNER JOIN \`lines\` AS \`lines\` ON \`lines\`.\`id\` = \`lines->LineStationTrain\`.\`line_id\`)
          ON \`Train\`.\`id\` = \`lines->LineStationTrain\`.\`train_id\`;

        `,
          {
            model: Train,
            mapToModel: true,
            nest: true,
            raw: true,
            type: QueryTypes.SELECT
          }
        );
      res.json(mergeObjectsKeyIntoArray(trains, "lines"));
    } catch (e) {
      next(e);
    }
  }
}
