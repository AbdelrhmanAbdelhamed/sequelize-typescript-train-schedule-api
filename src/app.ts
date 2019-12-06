import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as errorhandler from 'strong-error-handler';
/* import * as morgan from "morgan";
import * as path from "path";
import rotatingFileStream from 'rotating-file-stream'; */

import { registerRoutes } from 'decorate-express';

import StationController from './controllers/StationController';
import TrainController from './controllers/TrainController';
import LineController from './controllers/LineController';
import PolicePersonController from './controllers/PolicePersonController';
import PoliceDepartmentController from './controllers/PoliceDepartmentController';
import RankController from './controllers/RankController';
import UserController from './controllers/UserController';
import RoleController from './controllers/RoleController';

export const app = express();

// allow cross origin requests
app.use(cors());

// secure express app
app.use(helmet({
  dnsPrefetchControl: false,
  frameguard: false,
  ieNoOpen: false,
}));

// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// middleware for json body parsing
app.use(bodyParser.json());

// register routes
registerRoutes(app, new StationController());
registerRoutes(app, new TrainController());
registerRoutes(app, new LineController());
registerRoutes(app, new PoliceDepartmentController());
registerRoutes(app, new RankController());
registerRoutes(app, new PolicePersonController());
registerRoutes(app, new UserController());
registerRoutes(app, new RoleController());


/*
// create a rotating write stream
const accessLogStream = rotatingFileStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));
*/

// handle 404 error
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const err = new Error('Endpoint Not Found');
  res.status(404);
  next(err);
});

// handle errors
app.use(errorhandler({
  debug: true,
  // tslint:disable-next-line: no-console
  log: false,
}));
