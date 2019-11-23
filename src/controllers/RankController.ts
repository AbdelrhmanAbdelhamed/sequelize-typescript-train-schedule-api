import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Put, Use } from 'decorate-express';

import { PolicePerson } from "../models/PolicePerson";
import { Rank } from '../models/Rank';
import validateUser from '../middlewares/ValidateUser';

@BasePath('/api/ranks')
export default class RankController {

  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await Rank.create(req.body);
      res.status(201).json(rank);
    } catch (e) {
      next(e);
    }
  }

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await Rank.findAll({
        include: [PolicePerson]
      });
      res.json(rank);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await Rank.findByPk(req.params.id, {
        include: [PolicePerson]
      });
      res.json(rank);
    } catch (e) {
      next(e);
    }
  }

  @Put('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await Rank.update(req.body, {
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

