import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as util from "util";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { unpackRules } from '@casl/ability/extra'
import { Ability } from "@casl/ability";

export default async function validateUser(
  req: Request & {ability: any , user: User},
  res: Response,
  next: NextFunction
) {
  const authorizationHeader = req.headers.authorization;

  const jwtVerifyPromise = util.promisify(jwt.verify);
  try {
    if (authorizationHeader) {
      const bearer = authorizationHeader.split(" ");
      const token = bearer[1];
      const { userId, userRole, rules } = await jwtVerifyPromise(token, process.env.AUTH_SECRET_KEY!) as any;
      const unpackedRules = unpackRules(rules);
      const user: User = await User.findByPk(userId, {include: [Role]});
      if (!user || user.role!.name !== userRole.name) {
        res.status(401).send({
          code: 401,
          message: "Unauthorized!"
        });
      } else {
        req.ability = new Ability(unpackedRules);
        req.user = user;
        next();
      }
    } else {
      res.status(403).send({
        code: 403,
        message: "Forbidden!"
      });
    }
  } catch (e) {
    console.log(e);
    res.status(401).send({
      code: 401,
      message: "Unauthorized!"
    });
  }
}

