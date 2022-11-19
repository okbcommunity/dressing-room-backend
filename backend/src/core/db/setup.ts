import { PrismaClient } from '@prisma/client';
import { STAGE } from '../../config';
import appConfig from '../../config/app.config';

export const { closeDB, connectDB, db, setLogging } = (() => {
  let db: PrismaClient | null = null;
  let logging = false;

  function connectDB(): PrismaClient {
    if (db == null) {
      console.log('Successfully connected to database.');
      db = new PrismaClient({
        log:
          appConfig.stage === STAGE.LOCAL
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
              ]
            : [{ emit: 'stdout', level: 'error' }],
      });
      if (appConfig.stage === STAGE.LOCAL) {
        db.$on('query' as any, (e: any) => {
          if (logging) {
            console.log(`Executed Query: `, e.query, {
              params: e.params,
              duration: e.duration + 'ms',
            });
          }
        });
      }
    }
    return db;
  }

  async function closeDB() {
    if (db != null) {
      await db.$disconnect();
      console.log('Successfully closed the connection to the database.');
    }
  }

  function setLogging(value: boolean) {
    logging = value;
  }

  return { closeDB, connectDB, db: db ?? connectDB(), setLogging };
})();
