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
    const category = {
      id: generateUUID(),
      name: categoryName,
    };
    const attributes = [];

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
      const traitAssetVariants = await generateTraitAssetVariants(
        traitAsset,
        traitName
      );

      // Save Trait Asset Variatns to File System (for testing)
      const traitAssetVariantPaths = saveTraitAssetVariantsToFileSystem(
        traitAssetVariants,
        pathToParsedTraitsFolder,
        id
      );

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

async function generateTraitAssetVariants(
  traitAsset: Buffer,
  name: string
): Promise<TTraitAssetVariants> {
  let png2000x2000 = null;
  let png512x512 = null;
  let webp = null;
  try {
    png2000x2000 = traitAsset;
    png512x512 = await sharp(traitAsset).resize(512, 512).toBuffer();
    webp = await sharp(traitAsset).webp().toBuffer();
  } catch (err) {
    console.error(
      `Failed to convert Trait Asset '${name}' in specified variants!`
    );
  }

  return { png2000x2000, png512x512, webp };
}

async function saveTraitAssetVariantsToFileSystem(
  traitAssetVariants: TTraitAssetVariants,
  path: string,
  id: string
): Promise<TTraitAssetVariantPaths> {
  const paths: TTraitAssetVariantPaths = {
    png2000x2000: null,
    png512x512: null,
    webp: null,
  };

  try {
    if (traitAssetVariants.png2000x2000 != null) {
      (paths.png2000x2000 = `${path}/${id}_2000x2000.png`),
        await writeFile(paths.png2000x2000, traitAssetVariants.png2000x2000);
    }

    if (traitAssetVariants.png512x512 != null) {
      paths.png512x512 = `${path}/${id}_512x512.png`;
      await writeFile(paths.png512x512, traitAssetVariants.png512x512);
    }
    if (traitAssetVariants.webp != null) {
      paths.webp = `${path}/${id}.webp`;
      await writeFile(paths.webp, traitAssetVariants.webp);
    }
  } catch (err) {
    console.error(`Failed to save Trait Asset Variants to Local File System!`, {
      id,
    });
  }

  return paths;
}

type TTraitAssetVariants = {
  png2000x2000: Buffer | null;
  png512x512: Buffer | null;
  webp: Buffer | null;
};

type TTraitAssetVariantPaths = {
  png2000x2000: string | null;
  png512x512: string | null;
  webp: string | null;
};
