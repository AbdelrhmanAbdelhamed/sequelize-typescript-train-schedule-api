import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Patch, Delete, Use } from "decorate-express";

import { Station } from "../models/Station";
import { Line } from "../models/Line";
import { Train } from "../models/Train";
import validateUser from '../middlewares/ValidateUser';

@BasePath('/api/stations')
export default class StationController {

  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const station: Station = await Station.create(req.body);
      if (req.body.line) {
        const line = req.body.line;
        await station.$add("line", line.id, {
              through: { stationOrder: line.LineStation.stationOrder }
            });
      }
      res.status(201).json(station);
    } catch (e) {
      next(e);
    }
  }

  @Get("/")
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const stations = await Station.findAll({
        include: [Line]
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
          },
          {
            model: Train
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
      next(e);
    }
  }
}
