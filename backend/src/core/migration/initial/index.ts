import { composeBear, composeBears } from './composeBears';
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
    await migrateBearsCSV(
      config.bearsToMigrateCount,
      config.bearsToMigrate ?? undefined
    );
  }

  // Test layering a Bear
  if (config.steps.composeBears) {
    if (config.bearsToCompose != null) {
      for (const index of config.bearsToCompose as any) {
        await composeBear(index);
      }
    } else if (config.bearsToComposeCount != null) {
      await composeBears(config.bearsToComposeCount);
    }
  }
}
