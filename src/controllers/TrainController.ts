import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Get, Patch, Delete, Use } from "decorate-express";

import { Train } from "../models/Train";
import { TrainRun } from "../models/TrainRun";
import { PolicePerson } from "../models/PolicePerson";
import { Rank } from "../models/Rank";
import { PoliceDepartment } from "../models/PoliceDepartment";
import { Station } from "../models/Station";
import validateUser from "../middlewares/ValidateUser";
import { LineStation } from "../models/LineStation";
import { LineStationTrain } from "../models/LineStationTrain";
import { Line } from "../models/Line";
import { QueryTypes } from "sequelize";
import { sequelize } from "../sequelize";

@BasePath("/api/trains")
export default class TrainController {
  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { number, stations } = req.body;
      const [train] = await Train.findOrCreate({ where: { number } });
      if (stations) {
        await Promise.all(stations.map(station => {
          if (station.LineStationTrain.arrivalTime !== null || station.LineStationTrain.departureTime !== null) {
            return train.$add("lineStation", station.lineStationId, {
              through: {
                ...station.LineStationTrain
              }
            });
          }
        }));
      }
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
      next(e);
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
    if (req.query.departureStation && req.query.arrivalStation) {
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
            model: TrainRun,
            include: [
              {
                model: PolicePerson,
                include: [Rank, PoliceDepartment]
              }
            ]
          },
          Line
        ]
      });
      res.json(train);
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/stations")
  async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const train: Train = await Train.findByPk(req.params.id, { include: [LineStation] });
      let stations
      if (train && train.lineStations) {
        stations = await Promise.all(train.lineStations.map(async lineStation => {
          const stationItem = await Station.findByPk(lineStation.stationId);
          return {
            id: stationItem.id,
            name: stationItem.name,
            trainId: train.id,
            trainNumber: train.number,
            lineStationId: lineStation.id,
            LineStationTrain: {
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

  @Delete("/:id/lines/:lineId")
  async deleteLine(req: Request, res: Response, next: NextFunction) {
    try {
      await LineStationTrain.destroy({
        where: {
          trainId: req.params.id,
          lineId: req.params.lineId
        }
      });

      const count: any = await LineStationTrain.count({
        where: {
          trainId: req.params.id
        }
      });

      if (count <= 1) {
        await Train.destroy({
          where: {
            id: req.params.id
          }
        })
      }

      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  private async getByStations(req: Request, res: Response, next: NextFunction) {
    try {
      const trainsQuery = await sequelize.query(
        `
        SELECT 
            trains.id
        FROM
            trains
                JOIN
            line_station_trains AS departure_line_station_trains ON departure_line_station_trains.train_id = trains.id
                JOIN
            line_station_trains arrival_line_station_trains ON arrival_line_station_trains.train_id = trains.id
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
                AND departure_line_station.station_order <= arrival_line_station.station_order
        `,
        {
          bind: {
            departureStation: req.query.departureStation,
            arrivalStation: req.query.arrivalStation
          },
          raw: true,
          type: QueryTypes.SELECT
        }
      );

      const trains = await Train.findAll({
        where: {
          id: trainsQuery.map(train => train.id)
        },
        include: [
          {
            model: TrainRun,
            include: [
              {
                model: PolicePerson,
                include: [Rank, PoliceDepartment]
              }
            ]
          },
          Line,
          LineStation
        ]
      });

      res.json(trains);
    } catch (e) {
      next(e);
    }
  }

  private async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const trains = await Train.findAll({
        include: [
          {
            model: TrainRun,
            include: [
              {
                model: PolicePerson,
                include: [Rank, PoliceDepartment]
              }
            ]
          },
          Line,
          LineStation
        ]
      });
      res.json(trains);
    } catch (e) {
      next(e);
    }
  }
}
