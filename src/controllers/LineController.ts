import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Patch, Delete, Use } from 'decorate-express';

import { Line } from "../models/Line";
import { Train } from '../models/Train';
import { Station } from '../models/Station';
import validateUser from '../middlewares/ValidateUser';
import { literal, fn, col } from 'sequelize';
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
        attributes: {
          include: [
            [fn("COUNT", col("stations.id")), "stationCount"]
          ]
        },
        include: [
          {
            model: Station,
            attributes: []
          }
        ],
        group: [col("id")]
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
        include: [Station, Train],
        order: [[literal('`stations.LineStation.stationOrder`'), 'ASC']]
      });
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
          where: { id: req.params.id }
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
