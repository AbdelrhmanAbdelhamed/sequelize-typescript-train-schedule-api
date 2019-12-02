import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

const { AbilityBuilder, Ability } = require('@casl/ability');

export function defineAbilitiesFor(user: User) {
  const { rules, can: allow } = AbilityBuilder.extract();
  if (user && user.role) {

    if (user.role!.name === 'user') {
      allow('read', ['all']);
    }

    else if (user.role!.name === 'editor') {
      allow('read', ['Train', 'Station']);
      allow('manage', 'TrainRun');
      allow('read', 'UserTrain', { userId: user.id });
    }

    else if (user.role!.name === 'moderator') {
      allow(['manage'], ['Train', 'TrainRun', 'Line', 'Station'])
    }

    else if (user.role!.name === 'admin') {
      allow('manage', 'all')
    }

    return new Ability(rules)
  }
  return null;
}

export function createAbilities(req: Request & { ability: any, user: User }, res: Response, next: NextFunction) {
  req.ability = defineAbilitiesFor(req.user);
  next();
}
