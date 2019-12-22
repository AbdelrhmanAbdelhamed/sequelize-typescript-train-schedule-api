import { Request, Response, NextFunction } from 'express';
import { BasePath, Post, Get, Put, Use } from 'decorate-express';

import { Role } from '../models/Role';
import { User } from '../models/User';
import validateUser from '../middlewares/ValidateUser';

@BasePath('/api/roles')
export default class RoleController {

  @Use()
  validateUser(req: Request & {ability: any, user: User}, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await Role.create(req.body);
      res.status(201).json(role);
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
      const role = await Role.findAll();
      res.json(role);
    } catch (e) {
      next(e);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await Role.findByPk(req.params.id);
      res.json(role);
    } catch (e) {
      next(e);
    }
  }

  @Put('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await Role.update(req.body, {
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
