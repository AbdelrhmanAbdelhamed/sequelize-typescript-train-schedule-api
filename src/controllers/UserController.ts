import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as util from "util";
import { Request, Response, NextFunction } from "express";
import { BasePath, Post, Use, Get, Delete, Patch } from "decorate-express";

import { User } from "../models/User";
import validateUser from "../middlewares/ValidateUser";

@BasePath("/api/users")
export default class UserController {

  static async generateToken(user: User) {
    const jwtSignPromise = util.promisify(jwt.sign);
    const token = await jwtSignPromise({ userId: user.id, isAdmin: user.isAdmin }, process.env.AUTH_SECRET_KEY!);
    return token;
  }


  @Post("/login", [])
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      const user: User = await User.findOne({ where: { username } });
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

      const token = await UserController.generateToken(user);
      res
        .status(200)
        .json({ user, token });
    } catch (e) {
      next(e);
    }
  }

  @Post("/")
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.password) req.body.password = await User.hashPassword(req.body.password);
      const user: User = await User.create(req.body);
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  }

  @Use()
  validateUser(req: Request, res: Response, next: NextFunction) {
    validateUser(req, res, next);
  }

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.findAll({attributes: ['id', 'username', 'isAdmin']});
      res.json(users);
    } catch (e) {
      next(e);
    }
  }

  @Patch('/:id')
  async update(req: Request, res: Response, next: NextFunction) {
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
