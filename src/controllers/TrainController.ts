import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Get, Patch, Delete, Use } from "decorate-express";

import { Train } from "../models/Train";
import { Line } from "../models/Line";
import { TrainRun } from "../models/TrainRun";
import { QueryTypes } from "sequelize";
import { sequelize } from "../sequelize";
import { PolicePerson } from "../models/PolicePerson";
import { Rank } from "../models/Rank";
import { PoliceDepartment } from "../models/PoliceDepartment";
import { Station } from "../models/Station";
import validateUser from "../middlewares/ValidateUser";

@BasePath("/api/trains")
export default class TrainController {
  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const train = await Train.create(req.body);
      res.status(201).json(train);
    } catch (e) {
      next(e);
    }
  }

  @Post("/:id/runs")
  async addRun(req: Request, res: Response, next: NextFunction) {
    try {
      const train: Train = await Train.findByPk(req.params.id);
      if (train) {
        const { policePeople } = req.body;
        const policePeopleData: any = await Promise.all(
          await policePeople
            .map(policePerson => {
              const { rank, policeDepartment } = policePerson;
              return [
                PoliceDepartment.findOrCreate({
                  where: { name: policeDepartment.name }
                }),
                Rank.findOrCreate({
                  where: { name: rank.name }
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
              }
            });
          })
        );

        const policePeopleIds: any = resultPolicePeople.map(
          resultPolicePerson => resultPolicePerson[0].id
        );
        const trainRun: TrainRun = await TrainRun.create(req.body);
        await trainRun.$set("policePeople", policePeopleIds);

        res.status(201).json(trainRun);
      }
    } catch (e) {
      next(e);
    }
  }

  @Delete("/:trainId/runs/:id")
  async deleteRun(req: Request, res: Response, next: NextFunction) {
    try {
      await TrainRun.destroy({
        where: {
          id: req.params.id,
          trainId: req.params.trainId
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Get("/runs")
  async getAllTrainRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const trainRuns = await TrainRun.findAll({
        include: [
          Train,
          {
            model: PolicePerson,
            include: [Rank, PoliceDepartment]
          }
        ]
      });
      res.json(trainRuns);
    } catch (e) {
      next(e);
    }
  }

  @Get("/")
  async get(req: Request, res: Response, next: NextFunction) {
    if (req.query.fromStation && req.query.toStation) {
      this.getByStations(req, res, next);
    } else {
      this.getAll(req, res, next);
    }
  }

  @Get("/:id")
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const train = await Train.findByPk(req.params.id, {
        include: [
          {
            model: Line,
            include: [Station]
          },
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
      });
      res.json(train);
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
    } catch (e) {
      next(e);
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
      next(e);
    }
  }

  private async getByStations(req: Request, res: Response, next: NextFunction) {
    try {
      const trains = await sequelize.query(
        // tslint:disable-next-line: max-line-length
        "SELECT    `Train`.`id`,    `Train`.`number`,    `Train`.`line_id` AS `lineId`,    `Train`.`created_at` AS `createdAt`,    `Train`.`updated_at` AS `UpdatedAt`,    `line`.`id` AS `line.id`,    `line`.`name` AS `line.name`,    `line`.`created_at` AS `line.createdAt`,    `line`.`updated_at` AS `line.UpdatedAt`,    `trainRuns`.`id` AS `trainRuns.id`,    `trainRuns`.`day` AS `trainRuns.day`,    `trainRuns`.`train_id` AS `trainRuns.trainId`,    `trainRuns`.`created_at` AS `trainRuns.createdAt`,    `trainRuns`.`updated_at` AS `trainRuns.UpdatedAt`,    `trainRuns->policePeople`.`id` AS `trainRuns.policePeople.id`,    `trainRuns->policePeople`.`name` AS `trainRuns.policePeople.name`,    `trainRuns->policePeople`.`phone_number` AS `trainRuns.policePeople.phoneNumber`,    `trainRuns->policePeople`.`rank_id` AS `trainRuns.policePeople.rankId`,    `trainRuns->policePeople`.`police_department_id` AS `trainRuns.policePeople.policeDepartmentId`,    `trainRuns->policePeople`.`created_at` AS `trainRuns.policePeople.createdAt`,    `trainRuns->policePeople`.`updated_at` AS `trainRuns.policePeople.UpdatedAt`,    `trainRuns->policePeople->TrainRunPolicePerson`.`train_run_id` AS `trainRuns.policePeople.TrainRunPolicePerson.trainRunId`,    `trainRuns->policePeople->TrainRunPolicePerson`.`police_person_id` AS `trainRuns.policePeople.TrainRunPolicePerson.policePersonId`,    `trainRuns->policePeople->TrainRunPolicePerson`.`created_at` AS `trainRuns.policePeople.TrainRunPolicePerson.createdAt`,    `trainRuns->policePeople->TrainRunPolicePerson`.`updated_at` AS `trainRuns.policePeople.TrainRunPolicePerson.UpdatedAt`,    `trainRuns->policePeople->rank`.`id` AS `trainRuns.policePeople.rank.id`,    `trainRuns->policePeople->rank`.`name` AS `trainRuns.policePeople.rank.name`,    `trainRuns->policePeople->rank`.`created_at` AS `trainRuns.policePeople.rank.createdAt`,    `trainRuns->policePeople->rank`.`updated_at` AS `trainRuns.policePeople.rank.UpdatedAt`,    `trainRuns->policePeople->policeDepartment`.`id` AS `trainRuns.policePeople.policeDepartment.id`,    `trainRuns->policePeople->policeDepartment`.`name` AS `trainRuns.policePeople.policeDepartment.name`,    `trainRuns->policePeople->policeDepartment`.`created_at` AS `trainRuns.policePeople.policeDepartment.createdAt`,    `trainRuns->policePeople->policeDepartment`.`updated_at` AS `trainRuns.policePeople.policeDepartment.UpdatedAt`FROM    `trains` AS `Train`LEFT OUTER JOIN `lines` AS `line`ON    `Train`.`line_id` = `line`.`id`LEFT OUTER JOIN `train_runs` AS `trainRuns`ON    `Train`.`id` = `trainRuns`.`train_id`LEFT OUTER JOIN(        `train_run_police_people` AS `trainRuns->policePeople->TrainRunPolicePerson`    INNER JOIN `police_people` AS `trainRuns->policePeople`    ON        `trainRuns->policePeople`.`id` = `trainRuns->policePeople->TrainRunPolicePerson`.`police_person_id`    )ON    `trainRuns`.`id` = `trainRuns->policePeople->TrainRunPolicePerson`.`train_run_id`LEFT OUTER JOIN `ranks` AS `trainRuns->policePeople->rank`ON    `trainRuns->policePeople`.`rank_id` = `trainRuns->policePeople->rank`.`id`LEFT OUTER JOIN `police_departments` AS `trainRuns->policePeople->policeDepartment`ON    `trainRuns->policePeople`.`police_department_id` = `trainRuns->policePeople->policeDepartment`.`id`JOIN line_stations from_line_stations ON    (        from_line_stations.line_id = Train.line_id    )JOIN stations from_station ON    (        from_station.id = from_line_stations.station_id    )JOIN line_stations to_line_stations ON    (        to_line_stations.line_id = Train.line_id    )JOIN stations to_station ON    (        to_station.id = to_line_stations.station_id) WHERE   from_station.name = $fromStation AND to_station.name = $toStation AND from_line_stations.station_order <= to_line_stations.station_order",
        {
          bind: {
            fromStation: req.query.fromStation,
            toStation: req.query.toStation
          },
          model: Train,
          mapToModel: true,
          nest: true,
          raw: true,
          type: QueryTypes.SELECT
        }
      );

      const result: any[] = [];

      trains.forEach(train => {
        train.trainRuns.policePeople = [train.trainRuns.policePeople];
        train.trainRuns = train.trainRuns.id ? [train.trainRuns] : [];

        const NOT_FOUND = -1;
        const trainIndex = result.findIndex(
          resultTrain => resultTrain.id === train.id
        );

        if (trainIndex === NOT_FOUND) {
          result.push(train);
        } else {
          const trainRunIndex = result[trainIndex].trainRuns.findIndex(
            trainRunResult => trainRunResult.id === train.trainRuns[0].id
          );
          if (trainRunIndex === NOT_FOUND) {
            result[trainIndex].trainRuns.push(train.trainRuns[0]);
          } else {
            result[trainIndex].trainRuns[trainRunIndex].policePeople.push(
              train.trainRuns[0].policePeople[0]
            );
          }
        }
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }

  private async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const trains = await Train.findAll({
        include: [
          {
            model: Line,
            include: [Station]
          },
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
      });
      res.json(trains);
    } catch (e) {
      next(e);
    }
  }
}
