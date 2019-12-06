import { createServer } from 'http';
import { app } from './app';
import { sequelize } from './sequelize';

const port = process.env.Port || 3000;

(async () => {
  await sequelize.sync({force: false});

  createServer(app)
    .listen(
      port,
      // tslint:disable-next-line: no-console
      () => console.info(`Server running on port ${port}`)
    );
})();
