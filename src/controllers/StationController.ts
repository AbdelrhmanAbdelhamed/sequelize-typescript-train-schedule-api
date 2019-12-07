import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Patch, Delete, Use } from "decorate-express";

import { Station } from "../models/Station";
import { Line } from "../models/Line";
import validateUser from '../middlewares/ValidateUser';
import { LineStation } from '../models/LineStation';
import { col } from 'sequelize';
import { User } from '../models/User';

@BasePath('/api/stations')
export default class StationController {

  @Use()
  validateUser(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const [station] = await Station.findOrCreate({
        where: { name: req.body.name }
      });
      if (req.body.line.id) {
        const line = req.body.line;
        if (station.id) {
          await station.$add("line", line.id, {
            through: { stationOrder: line.LineStation.stationOrder }
          });
        }
        const lines = await station.$get("lines");
        res.status(201).json({ station, lines });
      }

    } catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Get("/")
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const stations = await Station.findAll({
        include: [Line],
        order: [[col('`lines.LineStation.station_order`'), 'ASC']]
      });
      res.json(stations);
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id")
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const station = await Station.findByPk(req.params.id, {
        include: [Line]
      });
      res.json(station);
    } catch (e) {
      next(e);
    }
  }

  @Get("/:id/lines")
  async getLines(req: Request, res: Response, next: NextFunction) {
    try {
      const lines = await Line.findAll({
        include: [
          {
            model: Station,
            where: { id: req.params.id }
          }
        ]
      });
      res.json(lines);
    } catch (e) {
      next(e);
    }
  }

  @Patch("/:id")
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await Station.update(req.body, {
        where: {
          id: req.params.id
        }
      });
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Patch("/:id/lines/:lineId")
  async updateStationOrder(req: Request, res: Response, next: NextFunction) {
    try {
      await LineStation.update(req.body, {
        where: {
          stationId: req.params.id,
          lineId: req.params.lineId
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
      await Station.destroy({
        where: {
          id: req.params.id
        }
      });
      res.sendStatus(200);
    } catch (e) {
      const ER_ROW_IS_REFERENCED_2 = "ER_ROW_IS_REFERENCED_2";
      if (e.original.code === ER_ROW_IS_REFERENCED_2) {
        res.sendStatus(400);
      } else {
        next(e);
      }
    }
  }

  @Delete("/:id/:lineId")
  async deleteLine(req: Request, res: Response, next: NextFunction) {
    try {
      const count: any = await LineStation.count({
        where: {
          stationId: req.params.id
        }
      });
      if (count <= 1) {
        await Station.destroy({
          where: {
            id: req.params.id
          }
        })
      }
      await LineStation.destroy({
        where: {
          stationId: req.params.id,
          lineId: req.params.lineId
        }
      });
      res.sendStatus(200);
    } catch (e) {
      const ER_ROW_IS_REFERENCED_2 = "ER_ROW_IS_REFERENCED_2";
      if (e.original.code === ER_ROW_IS_REFERENCED_2) {
        res.sendStatus(400);
      } else {
        next(e);
      }
    }
  }

}
