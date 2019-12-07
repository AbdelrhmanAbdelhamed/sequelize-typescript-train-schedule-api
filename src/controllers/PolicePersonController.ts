import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Put } from 'decorate-express';

import { PolicePerson } from "../models/PolicePerson";
import { Rank } from '../models/Rank';
import { PoliceDepartment } from '../models/PoliceDepartment';

@BasePath('/api/policepeople')
export default class PolicePersonController {

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const policePerson = await PolicePerson.create(req.body);
      res.status(201).json(policePerson);
    } catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const policePerson = await PolicePerson.findAll({
        include: [Rank, PoliceDepartment]
      });
      res.json(policePerson);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const policePerson = await PolicePerson.findByPk(req.params.id, {
        include: [Rank, PolicePerson]
      });
      res.json(policePerson);
    } catch (e) {
      next(e);
    }
  }

  @Put('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await PolicePerson.update(req.body, {
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

