import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as util from "util";
import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Use, Get, Delete, Patch, Put } from "decorate-express";

const { packRules } = require('@casl/ability/extra');

import { User } from "../models/User";
import validateUser from "../middlewares/ValidateUser";
import { createAbilities, defineAbilitiesFor } from "../middlewares/DefineAbilitiesFor";
import { Role } from "../models/Role";
import { Train } from "../models/Train";
import { PoliceDepartment } from "../models/PoliceDepartment";

@BasePath("/api/users")
export default class UserController {

  static async generateToken(userId: any, userRole: any, rules: any) {
    const jwtSignPromise = util.promisify(jwt.sign);
    const token = await jwtSignPromise({ userId, userRole, rules }, process.env.AUTH_SECRET_KEY!);
    return token;
  }

  @Post("/login", [])
  async login(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      const user: User = await User.findOne({ where: { username }, include: [Role] });
      if (!user)
        return res.status(404).json({
          code: 404,
          message: "User not found!"
        });

      const result = await bcrypt.compare(password, user.password);
      if (!result)
        return res.status(401).json({
          code: 401,
          message: "Password not valid!"
        });
      req.user = user.get({
        plain: true
      }) as any;
      const ability = await defineAbilitiesFor(req.user);
      const token = await UserController.generateToken(user.id, user.role, packRules(ability.rules));
      res
        .status(200)
        .json({ user, token });
    } catch (e) {
      next(e);
    }
  }

  @Use()
  async validateUser(req: Request & { ability: any, user: User } & { ability: any, user: User }, res: Response, next: NextFunction) {
    await validateUser(req, res, next);
  }

  @Use()
  async createAbilities(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
    await createAbilities(req, res, next);
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {

      const [policeDepartment] = await PoliceDepartment.findOrCreate({
        where: { name: req.body.policeDepartment.name }
      });

      if (req.body.password) req.body.password = await User.hashPassword(req.body.password);
      const user: User = await User.create(req.body);

      if (user && req.body.role) {
        await user.$set("role", req.body.role.id);
      }

      if (user && policeDepartment.id) {
        await user.$set("policeDepartment", policeDepartment.id);
      }

      res.status(201).json(user);
    } catch (e) {
      const ER_DUP_ENTRY = "ER_DUP_ENTRY";
      if (e.original && e.original.code === ER_DUP_ENTRY) {
        res.sendStatus(409);
      } else {
        next(e);
      }
    }
  }

  @Put("/:id/trains")
  async assignTrains(req: Request, res: Response, next: NextFunction) {
    try {
      const user: User = await User.findByPk(req.params.id);
      const trains = req.body;
      if (user) {
        if (trains) {
          await user.$set("trains", trains.map(train => train.id));
        }
      }
      res.json(trains);
    } catch (e) {
      next(e);
    }
  }

  @Delete("/:id/trains/:trainId")
  async deleteTrain(req: Request, res: Response, next: NextFunction) {
    try {
      const user: User = await User.findByPk(req.params.id);
      if (user) {
        await user.$remove("trains", [req.params.trainId]);
      }
      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.findAll({ attributes: ['id', 'username', 'fullName'], include: [Role, Train, PoliceDepartment] });
      res.json(users);
    } catch (e) {
      next(e);
    }
  }

  @Patch('/:id')
  async update(req: Request, res: Response, next: NextFunction) {

    if (req.body.policeDepartmentName) {
      const [policeDepartment] = await PoliceDepartment.findOrCreate({
        where: { name: req.body.policeDepartmentName }
      });
      req.body.policeDepartmentId = policeDepartment.id;
    }

    if (req.body.password) req.body.password = await User.hashPassword(req.body.password);
    try {
      await User.update(req.body, {
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
      await User.destroy({
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
