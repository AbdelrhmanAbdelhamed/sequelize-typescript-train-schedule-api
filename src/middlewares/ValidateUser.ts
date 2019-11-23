import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as util from "util";
import { User } from "../models/User";

export default async function validateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorizationHeader = req.headers.authorization;

  const jwtVerifyPromise = util.promisify(jwt.verify);
  try {
    if (authorizationHeader) {
      const bearer = authorizationHeader.split(" ");
      const token = bearer[ 1 ];
      const { userId, isAdmin } = await jwtVerifyPromise(token, process.env.AUTH_SECRET_KEY!) as any;
      const user = await User.findByPk(userId);
      if (!user || user.isAdmin !== isAdmin) {
        res.status(401).send({
          code: 401,
          message: "Unauthorized!"
        });
      } else {
        next();
      }
    } else {
      res.status(403).send({
        code: 403,
        message: "Forbidden!"
      });
    }
  } catch (e) {
    res.status(401).send({
      code: 401,
      message: "Unauthorized!"
    });
  }
}

