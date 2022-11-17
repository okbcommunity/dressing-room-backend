import path from 'path';
import appConfig from '../../config/app.config';
import { readDir, readFile } from '../file';

export async function migrate() {
  migrateAttributes();
  // migrateBears();
}

async function migrateAttributes() {
  // TODO Read Trait assets from traits folder (download from google drive)
  //  Note: some naming changes might be neccessary
  // TODO Convert Trait assets to '.webp' and crop it to 512x512
  // TODO Upload Trait assets to Github (for now)
  // TODO Add Trait to database
  // Create Category based on folder the Trait is in
  // https://www.npmjs.com/package/webp-converter

  const traitsFolderPath = path.join(appConfig.rootPath, 'local/traits');
  const filePaths = await readDir(traitsFolderPath);

  console.log({ filePaths });
}

async function migrateBears() {
  // TODO Read Bears from '.csv. file
  // TODO Add Bears to database and assign specified Attributes
}
