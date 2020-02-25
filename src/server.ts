import { createServer } from 'http';
import { app } from './app';
import { sequelize } from './sequelize';

const port = process.env.PORT || 3000;

(async () => {
  await sequelize.sync({force: false});
  await sequelize.query(`
  CREATE EVENT IF NOT EXISTS cleaning ON SCHEDULE EVERY 15 DAY ENABLE
  DO
DELETE train_runs, train_run_police_people, train_run_revisions
FROM train_runs
LEFT JOIN train_run_police_people ON train_runs.id = train_run_police_people.train_run_id
LEFT JOIN train_run_revisions ON train_runs.id = train_run_revisions.id
WHERE train_runs.day < CURDATE() - INTERVAL 15 DAY;
`);

  createServer(app)
    .listen(
      port,
      // tslint:disable-next-line: no-console
      () => console.info(`Server running on port ${port}`)
    );
})();
