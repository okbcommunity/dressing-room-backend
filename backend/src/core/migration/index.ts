import { initialMigration } from './initial';

export async function migrate() {
  initialMigration();
}
