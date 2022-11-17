import path from 'path';
import appConfig from '../../config/app.config';
import { readDir, readFile, readFilesFromDir } from '../file';

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

  const pathToTraitsFolder = path.join(appConfig.rootPath, 'local/traits');

  // Read Traits directory containing Traits Assets in Category directories
  const categoryDirNames = await readDir(pathToTraitsFolder);

  for (const categoryDirName of categoryDirNames) {
    const categoryName = categoryDirName.toLowerCase();

    // TODO create Category in DB

    // Read Trait Assets in Category directory
    const traitAssets = await readFilesFromDir(
      `${pathToTraitsFolder}/${categoryDirName}`,
      true
    );

    for (const traitAssetKey of Object.keys(traitAssets)) {
      const traitAsset = traitAssets[traitAssetKey];

      // TODO create different variants of Trait Asset

      // TODO create Trait in DB
      console.log({ traitAssetKey });
    }
  }
}

async function migrateBears() {
  // TODO Read Bears from '.csv. file
  // TODO Add Bears to database and assign specified Attributes
}
