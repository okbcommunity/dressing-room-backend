import { config } from './config';
import { migrateBearsCSV } from './migrateBearsCSV';
import { migrateTraitsFolder } from './migrateTraitsFolder';
import { renameDeep } from './renaming';

// Initial run to migrate all Trait Assets into the Database
// and to the Image Provider of choice
export async function initialMigration() {
  // File mutation
  if (config.steps.renameDeep) {
    renameDeep();
  }

  // Migration
  if (config.steps.migrateTraits) {
    await migrateTraitsFolder();
  }
  if (config.steps.migrateBears) {
    await migrateBearsCSV(300);
  }

  // Test layering a Bear
  if (config.steps.generateBears) {
    // await composeBear(202);
    // await composeBears(100);
  }
}
