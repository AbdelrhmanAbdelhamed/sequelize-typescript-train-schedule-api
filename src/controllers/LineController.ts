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

@BasePath('/api/lines')
export default class LineController {

  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
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
      const lines: Line[] = await Line.findAll({
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
     /* const linesWithTrains = await Promise.all(lines.map(async line => {
        let lineTrains = await Train.findAll({
          where: {
            lineId: line.id,
          },
          include: [{
            model: LineStation,
            required: true,
          }]
        })
        lineTrains = lineTrains.map(lineTrain => {
          let train = lineTrain.trains[0];
          return {
            id: train.id,
            number: train.number,
            createdAt: train.createdAt,
            updatedAt: train.updatedAt,
            lineStationTrain: train.LineStationTrain,
            LineStation: {
              id: lineTrain.id,
              lineId: lineTrain.lineId,
              stationId: lineTrain.stationId,
              stationOrder: lineTrain.stationOrder,
              createdAt: lineTrain.createdAt,
              updatedAt: lineTrain.updatedAt
            }
          }
        })
        const lineWithTrains = {
          id: line.id,
          name: line.name,
          createdAt: line.createdAt,
          updatedAt: line.updatedAt,
          stations: [...line.stations!],
          trains: [...lineTrains]
        }
        return lineWithTrains;
      })); */
      res.json(lines);
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
      /* let lineTrains = await LineStation.findAll({
        where: {
          lineId: line.id,
        },
        include: [{
          model: Train,
          required: true
        }]
      });

      lineTrains = lineTrains.map(lineTrain => {
        let train = lineTrain.trains[0];
        return {
          id: train.id,
          number: train.number,
          createdAt: train.createdAt,
          updatedAt: train.updatedAt,
          lineStationTrain: train.LineStationTrain,
          LineStation: {
            id: lineTrain.id,
            lineId: lineTrain.lineId,
            stationId: lineTrain.stationId,
            stationOrder: lineTrain.stationOrder,
            createdAt: lineTrain.createdAt,
            updatedAt: lineTrain.updatedAt
          }
        }
      })

      const lineWithTrains = {
        id: line.id,
        name: line.name,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
        stations: [...line.stations!],
        trains: [...lineTrains]
      } */
      res.json(line);
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
