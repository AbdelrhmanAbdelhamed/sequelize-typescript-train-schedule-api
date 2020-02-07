import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Get, Patch, Delete, Use, Put } from "decorate-express";

import { Train } from "../models/Train";
import { TrainRun } from "../models/TrainRun";
import { PolicePerson } from "../models/PolicePerson";
import { Rank } from "../models/Rank";
import { PoliceDepartment } from "../models/PoliceDepartment";
import { Station } from "../models/Station";
import { LineStation } from "../models/LineStation";
import { LineTrainStation } from "../models/LineTrainStation";
import { QueryTypes, col, Transaction } from "sequelize";
import validateUser from "../middlewares/ValidateUser";
import { User } from "../models/User";

import { sequelize, TrainRunRevision } from "../sequelize";

import { rulesToFields } from "@casl/ability/extra";
import isEmpty from "../utils/isEmpty";
import mergeObjectsKeysIntoArray from "../utils/mergeObjectsKeysIntoArray";
import joinObject from "../utils/joinObject";

import * as Moment from 'moment';

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
              ...station.LineTrainStation
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
                ...station.LineTrainStation
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
      await LineTrainStation.destroy({
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
      await LineTrainStation.bulkCreate(req.body.map(station => station.LineTrainStation), {
        updateOnDuplicate: ['departureTime', 'arrivalTime', 'isDeprature', 'isArrival']
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Patch("/:id/stations/:lineStationId")
  async updateStation(req: Request, res: Response, next: NextFunction) {
    try {
      await LineTrainStation.update(req.body, {
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

  @Get("/")
  async get(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    if (req.query.departureStation && req.query.arrivalStation) {
      this.getByStations(req, res, next);
    } else {
      this.getAll(req, res, next);
    }
  }

  @Get("/runs")
  async getAllTrainRuns(req: Request & { ability: any, User: any }, res: Response, next: NextFunction) {
    try {
      const conditions = rulesToFields(req.ability, "read", "UserTrain");
      const includeConditions = !isEmpty(conditions);
      const userTrainsJoinType = includeConditions ? 'INNER JOIN' : 'LEFT OUTER JOIN';
      const userJoinConditions = `\`train->users\`.\`id\` = \`train->users->UserTrain\`.\`user_id\`
                            ${
                              includeConditions
                              ?
                              'AND (\`train->users->UserTrain\`.' + joinObject(conditions, " = ", " OR ", "underscore") + ')'
                              : ''
                            }`;


      const trainRuns: TrainRun[] = await sequelize.query(`
      SELECT
        \`TrainRun\`.\`id\`,
        \`TrainRun\`.\`day\`,
        \`TrainRun\`.\`user_id\`,
        \`train\`.\`id\` AS \`train.id\`,
        \`train\`.\`number\` AS \`train.number\`,
        \`train->users\`.\`id\` AS \`train.users.id\`,
        \`train->users->UserTrain\`.\`user_id\` AS \`train.users.UserTrain.userId\`,
        \`policePeople\`.\`id\` AS \`policePeople.id\`,
        \`policePeople\`.\`name\` AS \`policePeople.name\`,
        \`policePeople\`.\`phone_number\` AS \`policePeople.phoneNumber\`,
        \`policePeople->TrainRunPolicePerson\`.\`from_station_id\` AS \`policePeople.TrainRunPolicePerson.fromStationId\`,
        \`policePeople->TrainRunPolicePerson\`.\`to_station_id\` AS \`policePeople.TrainRunPolicePerson.toStationId\`,
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`id\` AS \`policePeople.TrainRunPolicePerson.fromStation.id\`,
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`name\` AS \`policePeople.TrainRunPolicePerson.fromStation.name\`,
        \`policePeople->TrainRunPolicePerson->toStation\`.\`id\` AS \`policePeople.TrainRunPolicePerson.toStation.id\`,
        \`policePeople->TrainRunPolicePerson->toStation\`.\`name\` AS \`policePeople.TrainRunPolicePerson.toStation.name\`,
        \`policePeople->rank\`.\`id\` AS \`policePeople.rank.id\`,
        \`policePeople->rank\`.\`name\` AS \`policePeople.rank.name\`,
        \`policePeople->policeDepartment\`.\`id\` AS \`policePeople.policeDepartment.id\`,
        \`policePeople->policeDepartment\`.\`name\` AS \`policePeople.policeDepartment.name\`
    FROM
        \`train_runs\` AS \`TrainRun\`
          ${userTrainsJoinType}
        \`trains\` AS \`train\` ON \`TrainRun\`.\`train_id\` = \`train\`.\`id\`
          ${userTrainsJoinType}
        (\`user_trains\` AS \`train->users->UserTrain\`
       INNER JOIN \`users\` AS \`train->users\` ON
          ${userJoinConditions}) ON \`train\`.\`id\` = \`train->users->UserTrain\`.\`train_id\`
            LEFT OUTER JOIN
        (\`train_run_police_people\` AS \`policePeople->TrainRunPolicePerson\`
        INNER JOIN \`police_people\` AS \`policePeople\` ON
        \`policePeople\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`police_person_id\`) ON
          \`TrainRun\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`train_run_id\`
            LEFT OUTER JOIN
        \`stations\` AS \`policePeople->TrainRunPolicePerson->fromStation\` ON
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`from_station_id\`
            LEFT OUTER JOIN
        \`stations\` AS \`policePeople->TrainRunPolicePerson->toStation\` ON
        \`policePeople->TrainRunPolicePerson->toStation\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`to_station_id\`
            LEFT OUTER JOIN
        \`ranks\` AS \`policePeople->rank\` ON \`policePeople\`.\`rank_id\` = \`policePeople->rank\`.\`id\`
            LEFT OUTER JOIN
        \`police_departments\` AS \`policePeople->policeDepartment\` ON
        \`policePeople\`.\`police_department_id\` = \`policePeople->policeDepartment\`.\`id\`
    ORDER BY \`day\` DESC;
    `, {
        model: TrainRun,
        mapToModel: true,
        nest: true,
        raw: true,
        type: QueryTypes.SELECT
      });
      res.json(mergeObjectsKeysIntoArray(trainRuns, ["policePeople"]));
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/runs")
  async getTrainRunsByTrainId(req: Request & { ability: any, user: any }, res: Response, next: NextFunction) {
    try {
      const conditions = rulesToFields(req.ability, "read", "UserTrain");
      const includeConditions = !isEmpty(conditions);
      const userTrainsJoinType = includeConditions ? 'INNER JOIN' : 'LEFT OUTER JOIN';
      const userJoinConditions = `\`train->users\`.\`id\` = \`train->users->UserTrain\`.\`user_id\`
                            ${
                              includeConditions
                              ?
                              'AND (\`train->users->UserTrain\`.' + joinObject(conditions, " = ", " OR ", "underscore") + ')'
                              : ''
                            }`;

      const trainRuns: TrainRun[] = await sequelize.query(`
      SELECT
        \`TrainRun\`.\`id\`,
        \`TrainRun\`.\`day\`,
        \`TrainRun\`.\`user_id\`,
        \`train\`.\`id\` AS \`train.id\`,
        \`train\`.\`number\` AS \`train.number\`,
        \`train->users\`.\`id\` AS \`train.users.id\`,
        \`train->users->UserTrain\`.\`user_id\` AS \`train.users.UserTrain.userId\`,
        \`policePeople\`.\`id\` AS \`policePeople.id\`,
        \`policePeople\`.\`name\` AS \`policePeople.name\`,
        \`policePeople\`.\`phone_number\` AS \`policePeople.phoneNumber\`,
        \`policePeople->TrainRunPolicePerson\`.\`from_station_id\` AS \`policePeople.TrainRunPolicePerson.fromStationId\`,
        \`policePeople->TrainRunPolicePerson\`.\`to_station_id\` AS \`policePeople.TrainRunPolicePerson.toStationId\`,
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`id\` AS \`policePeople.TrainRunPolicePerson.fromStation.id\`,
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`name\` AS \`policePeople.TrainRunPolicePerson.fromStation.name\`,
        \`policePeople->TrainRunPolicePerson->toStation\`.\`id\` AS \`policePeople.TrainRunPolicePerson.toStation.id\`,
        \`policePeople->TrainRunPolicePerson->toStation\`.\`name\` AS \`policePeople.TrainRunPolicePerson.toStation.name\`,
        \`policePeople->rank\`.\`id\` AS \`policePeople.rank.id\`,
        \`policePeople->rank\`.\`name\` AS \`policePeople.rank.name\`,
        \`policePeople->policeDepartment\`.\`id\` AS \`policePeople.policeDepartment.id\`,
        \`policePeople->policeDepartment\`.\`name\` AS \`policePeople.policeDepartment.name\`
    FROM
        \`train_runs\` AS \`TrainRun\`
          ${userTrainsJoinType}
        \`trains\` AS \`train\` ON \`TrainRun\`.\`train_id\` = \`train\`.\`id\`
          ${userTrainsJoinType}
        (\`user_trains\` AS \`train->users->UserTrain\`
       INNER JOIN \`users\` AS \`train->users\` ON
          ${userJoinConditions}) ON \`train\`.\`id\` = \`train->users->UserTrain\`.\`train_id\`
            LEFT OUTER JOIN
        (\`train_run_police_people\` AS \`policePeople->TrainRunPolicePerson\`
        INNER JOIN \`police_people\` AS \`policePeople\` ON
        \`policePeople\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`police_person_id\`) ON
          \`TrainRun\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`train_run_id\`
            LEFT OUTER JOIN
        \`stations\` AS \`policePeople->TrainRunPolicePerson->fromStation\` ON
        \`policePeople->TrainRunPolicePerson->fromStation\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`from_station_id\`
            LEFT OUTER JOIN
        \`stations\` AS \`policePeople->TrainRunPolicePerson->toStation\` ON
        \`policePeople->TrainRunPolicePerson->toStation\`.\`id\` = \`policePeople->TrainRunPolicePerson\`.\`to_station_id\`
            LEFT OUTER JOIN
        \`ranks\` AS \`policePeople->rank\` ON \`policePeople\`.\`rank_id\` = \`policePeople->rank\`.\`id\`
            LEFT OUTER JOIN
        \`police_departments\` AS \`policePeople->policeDepartment\` ON
        \`policePeople\`.\`police_department_id\` = \`policePeople->policeDepartment\`.\`id\`
      WHERE
        \`TrainRun\`.\`train_id\` = $train_id
    ORDER BY \`day\` DESC;
    `, {
        bind: {
          train_id: req.params.id,
        },
        model: TrainRun,
        mapToModel: true,
        nest: true,
        raw: true,
        type: QueryTypes.SELECT
      });
      res.json(mergeObjectsKeysIntoArray(trainRuns, ["policePeople"]));
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
      const train = await Train.findByPk(req.params.id);
      res.json(train);

    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/stations/lines/:lineId")
  async getTrainLineStations(req: Request, res: Response, next: NextFunction) {
    try {

    const stations = await sequelize.query(
      `
        SELECT
        \`Train\`.\`id\` AS \`train.id\`,
        \`Train\`.\`number\` AS \`train.number\`,
        \`lineStations\`.\`station_order\` AS \`LineStation.stationOrder\`,
        \`lineStations->LineTrainStation\`.\`id\` AS \`LineTrainStation.id\`,
        date_format(\`lineStations->LineTrainStation\`.\`arrival_time\`, '%H:%i:%s') AS \`LineTrainStation.arrivalTime\`,
        date_format(\`lineStations->LineTrainStation\`.\`departure_time\`, '%H:%i:%s') AS \`LineTrainStation.departureTime\`,
        \`lineStations->LineTrainStation\`.\`line_station_id\` AS \`LineTrainStation.lineStationId\`,
        \`lineStations->LineTrainStation\`.\`train_id\` AS \`LineTrainStation.trainId\`,
        \`Station\`.\`id\`,
        \`Station\`.\`name\`
    FROM
        \`trains\` AS \`Train\`
            LEFT OUTER JOIN
        (\`line_train_stations\` AS \`lineStations->LineTrainStation\`
        INNER JOIN \`line_stations\` AS \`lineStations\`
         ON \`lineStations\`.\`id\` = \`lineStations->LineTrainStation\`.\`line_station_id\`
            AND \`lineStations->LineTrainStation\`.\`line_id\` = $lineId)
             ON \`Train\`.\`id\` = \`lineStations->LineTrainStation\`.\`train_id\`
            JOIN
        \`stations\` AS \`Station\` ON \`Station\`.id = \`lineStations\`.\`station_id\`
    WHERE
        \`Train\`.\`id\` = $id
    ORDER BY \`LineStation.stationOrder\` ASC;
      `,
        {
          bind: {
            id: req.params.id,
            lineId: req.params.lineId
          },
          model: Train,
          mapToModel: true,
          nest: true,
          raw: true,
          type: QueryTypes.SELECT
        }
      );
    res.json(stations);
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
            LineTrainStation: {
              id: lineStation.LineTrainStation.id,
              arrivalTime: lineStation.LineTrainStation.arrivalTime,
              departureTime: lineStation.LineTrainStation.departureTime,
              isArrival: lineStation.LineTrainStation.isArrival,
              isDeprature: lineStation.LineTrainStation.isDeprature,
              createdAt: lineStation.LineTrainStation.createdAt,
              updatedAt: lineStation.LineTrainStation.updatedAt
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
      const lineTrainStations: any = await LineTrainStation.findAll({
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
      await LineTrainStation.destroy({
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
    SELECT DISTINCT
        \`departure_lines\`.id AS \`lines.id\`,
      \`departure_lines\`.name AS \`lines.name\`,
        Train.id,
        Train.number,
        users.id AS \`users.id\`,
        \`users->UserTrain\`.user_id AS \`users.UserTrain.userId\`,
        \`departure_stations\`.\`name\` AS \`departureStation.name\`,
        \`departure_line_train_stations\`.\`departure_time\` AS \`departureStation.departureTime\`,
        \`departure_line_train_stations\`.\`arrival_time\` AS \`departureStation.arrivalTime\`,
        \`arrival_stations\`.\`name\` AS \`arrivalStation.name\`,
        \`arrival_line_train_stations\`.\`arrival_time\` AS \`arrivalStation.arrivalTime\`,
        \`arrival_line_train_stations\`.\`departure_time\` AS \`arrivalStation.departureTime\`
    FROM
        trains AS Train
            LEFT OUTER JOIN
        (user_trains AS \`users->UserTrain\`
        INNER JOIN users AS \`users\` ON users.id = \`users->UserTrain\`.user_id) ON Train.id = \`users->UserTrain\`.train_id
            JOIN
        line_train_stations AS departure_line_train_stations ON departure_line_train_stations.train_id = Train.id
            JOIN
        \`lines\` AS departure_lines ON departure_lines.id = departure_line_train_stations.line_id
            JOIN
        line_train_stations arrival_line_train_stations ON arrival_line_train_stations.train_id = Train.id
            JOIN
        \`lines\` AS arrival_lines ON arrival_lines.id = arrival_line_train_stations.line_id
            JOIN
        line_stations AS departure_line_station ON departure_line_station.id = departure_line_train_stations.line_station_id
            JOIN
        line_stations AS arrival_line_station ON arrival_line_station.id = arrival_line_train_stations.line_station_id
            JOIN
        stations AS departure_stations ON departure_stations.id = departure_line_station.station_id
            JOIN
        stations AS arrival_stations ON arrival_stations.id = arrival_line_station.station_id
    WHERE
        departure_stations.name = $departureStation
            AND arrival_stations.name = $arrivalStation
            AND (departure_line_train_stations.departure_time IS NOT NULL
                OR departure_line_train_stations.arrival_time IS NOT NULL)
            AND (arrival_line_train_stations.arrival_time IS NOT NULL
                OR arrival_line_train_stations.departure_time IS NOT NULL)
            AND departure_line_station.station_order < arrival_line_station.station_order
            AND departure_lines.name = arrival_lines.name
    ORDER BY COALESCE(departure_line_train_stations.departure_time, departure_line_train_stations.arrival_time) ASC
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
      const results = mergeObjectsKeysIntoArray(trains, ["lines", "users"]).map((trainsData: any) => {
        const start = trainsData.departureStation.departureTime ?? trainsData.departureStation.arrivalTime;
        const end = trainsData.arrivalStation.arrivalTime ?? trainsData.arrivalStation.departureTime;
        trainsData.crossedNextDay = Moment.utc(end, "HH:mm:ss").isBefore(Moment.utc(start, "HH:mm:ss"));
        return trainsData;
      });
      res.json(results);
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
            (\`line_train_stations\` AS \`lines->LineTrainStation\`
        INNER JOIN \`lines\` AS \`lines\` ON \`lines\`.\`id\` = \`lines->LineTrainStation\`.\`line_id\`)
          ON \`Train\`.\`id\` = \`lines->LineTrainStation\`.\`train_id\`;

        `,
          {
            model: Train,
            mapToModel: true,
            nest: true,
            raw: true,
            type: QueryTypes.SELECT
          }
        );
      res.json(mergeObjectsKeysIntoArray(trains, ["lines", "users"]));
    } catch (e) {
      next(e);
    }
  }
}
