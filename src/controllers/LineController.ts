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
import { col } from 'sequelize';

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
      const lines = await Line.findAll({
        include: [{
          model: Train,
          include: [{
            model: TrainRun,
            include: [ {
              model: PolicePerson,
              include: [ Rank, PoliceDepartment ]
            } ]
          }]
        }, Station],
        order: [[col('`stations.LineStation.station_order`'), 'ASC']]
      });
      res.json(lines);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const line = await Line.findByPk(req.params.id, {
        include: [{
          model: Train,
          include: [{
            model: TrainRun,
            include: [ {
              model: PolicePerson,
              include: [ Rank, PoliceDepartment ]
            } ]
          }]
        }, Station],
        order: [[col('`stations.LineStation.station_order`'), 'ASC']]
      });
      res.json(line);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id/trains')
  async getTrains(req: Request, res: Response, next: NextFunction) {
    try {
      const trains = await Train.findAll({
        where: { line_id: req.params.id },
        include: [{
          model: TrainRun,
          include: [ {
            model: PolicePerson,
            include: [ Rank, PoliceDepartment ]
          } ]
        }]
      });
      res.json(trains);
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
              include: [ {
                model: PolicePerson,
                include: [ Rank, PoliceDepartment ]
              } ]
            }]
          }]
        }],
        order: [[col('`stations.LineStation.station_order`'), 'ASC']]
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
