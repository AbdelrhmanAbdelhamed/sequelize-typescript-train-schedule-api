import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Put, Use } from 'decorate-express';

import { PoliceDepartment } from "../models/PoliceDepartment";
import { PolicePerson } from '../models/PolicePerson';
import validateUser from '../middlewares/ValidateUser';
import { User } from '../models/User';

@BasePath('/api/PoliceDepartments')
export default class PoliceDepartmentController {

  @Use()
  validateUser(req: Request & {ability: any, user: User}, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const policeDepartment = await PoliceDepartment.create(req.body);
      res.status(201).json(policeDepartment);
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
      const policeDepartments = await PoliceDepartment.findAll();
      res.json(policeDepartments);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const policeDepartments = await PoliceDepartment.findByPk(req.params.id, {
        include: [PolicePerson]
      });
      res.json(policeDepartments);
    } catch (e) {
      next(e);
    }
  }

  @Put('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await PoliceDepartment.update(req.body, {
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
