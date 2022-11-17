import path from 'path';
import sharp from 'sharp';
import appConfig from '../../config/app.config';
import { generateUUID } from '../../utlis';
import { readDir, writeFile, readFilesFromDir } from '../file';

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
  const pathToParsedTraitsFolder = path.join(
    appConfig.rootPath,
    'local/parsedTraits'
  );

  // Read Traits directory containing Traits Assets in Category directories
  const categoryDirKeys = await readDir(pathToTraitsFolder);

  for (const categoryDirKey of categoryDirKeys) {
    const categoryName = formatCategoryName(categoryDirKey);

    // TODO create Category in DB

    // Read Trait Assets in Category directory
    const traitAssets = await readFilesFromDir(
      `${pathToTraitsFolder}/${categoryDirKey}`,
      true
    );

    for (const traitAssetKey of Object.keys(traitAssets)) {
      const traitAsset = traitAssets[traitAssetKey];
      const traitName = formatTraitName(traitAssetKey, categoryName);
      const id = generateUUID();

      // Create different variants of the Trait Asset
      const png2000x2000 = traitAsset;
      const png512x512 = await sharp(traitAsset).resize(512, 512).toBuffer();
      const webp = await sharp(traitAsset).webp().toBuffer();

      // Store assets in Parse Traits folder (for testing)
      await writeFile(
        `${pathToParsedTraitsFolder}/${id}_2000x2000.png`,
        png2000x2000
      );
      await writeFile(
        `${pathToParsedTraitsFolder}/${id}_512x512.png`,
        png512x512
      );
      await writeFile(`${pathToParsedTraitsFolder}/${id}.webp`, webp);

      // TODO Upload Trait to Github

      // TODO create Trait in DB

      console.log({
        name: traitName,
        id,
      });
    }
  }
}

async function migrateBears() {
  // TODO Read Bears from '.csv. file
  // TODO Add Bears to database and assign specified Attributes
}

function formatTraitName(name: string, categoryName: string): string {
  let newName = name;
  try {
    // Replace general not required characters
    newName = newName
      .replace(categoryName, '') // Replace Category Name (e.g. fur_happy.png -> _happy.png)
      .replace('_', ' ')
      .replace('.png', '')
      .replace(/[^a-zA-Z ]/g, '')
      .trim();
    // Make each Word uppercase (e.g. fur tan -> Fur Tan)
    const words = newName
      .split(' ')
      .map((word) =>
        word != null
          ? `${word.charAt(0).toUpperCase()}${word.substring(1).toLowerCase()}`
          : word
      );
    newName = words.join(' ');
  } catch (err) {
    console.error(`Failed to parse '${name}'!`);
  }
  return newName;
}

function formatCategoryName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
