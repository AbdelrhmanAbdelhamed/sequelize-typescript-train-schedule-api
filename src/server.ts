import { createServer } from 'http';
import { app } from './app';
import { sequelize } from './sequelize';

(async () => {
  await sequelize.sync({force: false});

  createServer(app)
    .listen(
      process.env.PORT,
      // tslint:disable-next-line: no-console
      () => console.info(`Server running on port ${process.env.PORT}`)
    );
})();
