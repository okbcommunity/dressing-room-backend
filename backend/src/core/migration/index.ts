import { Prisma, Trait } from '@prisma/client';
import path from 'path';
import sharp from 'sharp';
import appConfig from '../../config/app.config';
import { generateUUID } from '../../utlis';
import { db } from '../db';
import { readDir, writeFile, readFilesFromDir, renameFilesDeep } from '../file';

const spaceChar = '_';
const chainChar = '-';

export async function migrate() {
  migrateTraits();
  // renameFilesDeep(
  //   path.join(appConfig.rootPath, 'local/traits'),
  //   (dirpath, filename) => `${dirpath}/${filename.replace('_', '-')}`
  // );
  // migrateBears();
}

// ============================================================================
// Migrate Traits (from Traits Asset Folder)
// ============================================================================

async function migrateTraits() {
  // Logging
  const timetaken = 'Time taken migrating Categories and Traits';
  console.log('--- Start migrating Traits ---');
  console.time(timetaken);

  const pathToTraitsFolder = path.join(appConfig.rootPath, 'local/traits');
  const pathToParsedTraitsFolder = path.join(
    appConfig.rootPath,
    'local/parsedTraits'
  );

  // Read Traits directory containing Traits Assets in Category directories
  const categoryDirKeys = await readDir(pathToTraitsFolder);

  for (const categoryDirKey of categoryDirKeys) {
    const { index: layerIndex, name: categoryName } =
      formatCategoryName(categoryDirKey);

    // Create or Get existing Layer from DB
    const layerId = await createOrGetLayer(layerIndex);

    // Create Category in DB
    const categoryId = generateUUID();
    await db.category.create({
      data: {
        id: categoryId,
        name: categoryName,
        layer_id: layerId,
      },
    });

    // Logging
    console.log(`Started migrating Category '${categoryName}'`);

    // Read Trait Assets in Category directory
    const traitAssets = await readFilesFromDir(
      `${pathToTraitsFolder}/${categoryDirKey}`,
      true
    );

    for (const traitAssetKey of Object.keys(traitAssets)) {
      const traitAsset = traitAssets[traitAssetKey];
      const { name: traitName, dependency: traitDependencyName } =
        formatTraitName(traitAssetKey, categoryName);
      const id = generateUUID();

      // Query Trait dependency if there exists one
      // e.g. 'closed-coral' depends on 'coral' fur
      let traitDependencyId: string | null = null;
      if (traitDependencyName != null) {
        const trait = await findTraitByName(traitDependencyName);
        traitDependencyId = trait?.id || null;
      }

      // Create different variants of the Trait Asset
      // const traitAssetVariants = await generateTraitAssetVariants(
      //   traitAsset,
      //   traitName
      // );

      // Save Trait Asset Variatns to File System (for testing)
      // const traitAssetVariantPaths = await saveTraitAssetVariantsToFileSystem(
      //   traitAssetVariants,
      //   pathToParsedTraitsFolder,
      //   id
      // );

      // TODO Upload Trait to Github

      // Create Trait in DB
      await db.trait.create({
        data: {
          id,
          name: traitName,
          category_id: categoryId,
          image_url_webp: '', // traitAssetVariantPaths.webp,
          image_url_png_2000x2000: '', // traitAssetVariantPaths.png2000x2000,
          image_url_png_512x512: '', /// traitAssetVariantPaths.png512x512,
          depending_on_traits:
            traitDependencyId != null
              ? {
                  create: {
                    trait_id: traitDependencyId,
                  },
                }
              : undefined,
        },
      });
    }
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Traits ---');
}

// ============================================================================
// Migrate Bears (from CSV)
// ============================================================================

async function migrateBears() {
  // TODO Read Bears from '.csv. file
  // TODO Add Bears to database and assign specified Attributes
}

// ============================================================================
// Helper
// ============================================================================

function formatTraitName(
  name: string,
  categoryName: string
): { name: string; dependency: string | null } {
  const parts = name
    .replace(/^.+\//, '') // Replace everything until '/' belonging to the path -> 'closed/closed-albino' -> 'closed-albino'
    .replace('.png', '')
    .split(chainChar);
  let dependency: null | string = null;
  let newName = name;

  try {
    // Format Name
    if (parts[0] != null) {
      newName = `${parts[0]}_${parts[1] || ''}`; // Readd Dependency to Display Name

      // Remove or replace not required Chars
      newName = newName
        .toLowerCase()
        .replace(categoryName.toLowerCase(), '') // Replace Category Name (e.g. fur_happy.png -> _happy.png)
        .replace(spaceChar, ' ')
        .replace(/[^a-zA-Z ]/g, '') // Replace spcial signs
        .trim();

      // Make each Word uppercase (e.g. fur tan -> Fur Tan)
      const words = newName
        .split(' ')
        .map((word) =>
          word != null
            ? `${word.charAt(0).toUpperCase()}${word
                .substring(1)
                .toLowerCase()}`
            : word
        );
      newName = words.join(' ');
    }

    // Extract Dependency
    if (parts[1] != null) {
      dependency = parts[1].toLowerCase();
    }
  } catch (err) {
    console.error(`Failed to parse Trait Name '${name}'!`);
  }

  console.log({ parts, newName });

  return {
    dependency,
    name: newName,
  };
}

function formatCategoryName(name: string): { name: string; index: number } {
  const parts = name.split(chainChar);
  let index = -1;
  let newName = name;

  try {
    // Extract Layer
    if (parts[0] != null) {
      index = +parts[0];
    }

    // Format Name
    if (parts[1] != null) {
      newName =
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    }
  } catch (err) {
    console.error(`Failed to parse Category Name '${name}'!`);
  }

  return {
    index,
    name: newName,
  };
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
      paths.png2000x2000 = `${path}/${id}_2000x2000.png`;
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

async function createOrGetLayer(index: number): Promise<string> {
  let id = generateUUID();
  const response = await db.layer.findUnique({
    where: { index },
    select: { id: true },
  });
  if (response == null) {
    await db.layer.create({
      data: {
        id,
        index,
      },
    });
  } else {
    id = response.id;
  }
  return id;
}

async function findTraitByName(name: string): Promise<Trait | null> {
  return await db.trait.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });
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
