import { PrismaClient } from '@prisma/client';
import { STAGE } from '../../config';
import appConfig from '../../config/app.config';

export const { closeDB, connectDB, db } = (() => {
  let db: PrismaClient | null = null;

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
          console.log(`Executed Query: `, e.query, {
            params: e.params,
            duration: e.duration + 'ms',
          });
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

  return { closeDB, connectDB, db: db ?? connectDB() };
})();
