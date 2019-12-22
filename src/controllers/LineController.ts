import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Patch, Delete, Use } from 'decorate-express';

import { Line } from "../models/Line";
import { Station } from '../models/Station';
import validateUser from '../middlewares/ValidateUser';
import { literal, fn, col, Transaction } from 'sequelize';
import { User } from '../models/User';
import { Train } from '../models/Train';
import { sequelize } from '../sequelize';
import { LineStationTrain } from '../models/LineStationTrain';

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
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
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
      const line = await Line.findByPk(req.params.id);
      res.json(line);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id/stations')
  async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      let stations = await Station.findAll({
        include: [{
          model: Line,
          required: true,
          through: { where: { lineId: req.params.id } }
        }],
        order: [[literal('`lines.LineStation.stationOrder`'), 'ASC']]
      });
      if(stations.length <= 0) {
        const line = await Line.findByPk(req.params.id);
        stations = {line};
      }
      res.json(stations);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id/trains')
  async getTrains(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    try {
      let trains = await Train.scope({ method: ['accessibleBy', req.ability] }).findAll({
        include: [
          {
            model: Line,
            required: true,
            through: { where: { lineId: req.params.id } }
          }
        ]
      });
      if(trains.length <= 0) {
        const line = await Line.findByPk(req.params.id);
        trains = {line};
      }
      res.json(trains);
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
    const transaction: Transaction = await sequelize.transaction();
    try {
      const trainIds: any[] = await LineStationTrain.findAll({
        attributes: [[literal('DISTINCT `train_id`'), 'id']],
        where: {
          lineId: req.params.id
        },
        transaction
      }).map(train => train.id);

      for (const trainId of trainIds) {
        const lineTrainStations: any = await LineStationTrain.findAll({
          where: {
            trainId
          },
          transaction,
          group: [col('trainId'), col('lineId')]
        });

        if (lineTrainStations.length <= 1) {
          await Train.destroy({
            where: {
              id: trainId
            },
            transaction
          });
        }
      }

      await Line.destroy({
        where: {
          id: req.params.id
        },
        transaction
      });

      await transaction.commit();
      res.json(trainIds);
    } catch (e) {
      await transaction.rollback();
      next(e);
    }
  }
}
