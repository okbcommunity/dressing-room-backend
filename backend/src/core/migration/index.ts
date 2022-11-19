import { Trait } from '@prisma/client';
import path from 'path';
import sharp, { OverlayOptions } from 'sharp';
import appConfig from '../../config/app.config';
import { generateUUID } from '../../utlis';
import { db, setLogging } from '../db';
import {
  readDir,
  writeFile,
  readFilesFromDir,
  readFile,
  parseCSVFile,
} from '../file';

const spaceChar = '_';
const chainChar = '-';

const pathToTraitsFolder = path.join(appConfig.rootPath, 'local/traits');
const pathToParsedTraitsFolder = path.join(
  appConfig.rootPath,
  'local/parsedTraits'
);
const pathToGeneratedBearTests = path.join(
  appConfig.rootPath,
  'local/generated'
);

const fast = true;

// Inital run to migrate all Trait Assets into the Database
// and to the Image Provider of choice
export async function migrate() {
  // renameFilesDeep(
  //   path.join(appConfig.rootPath, 'local/traits'),
  //   (dirpath, filename) => `${dirpath}/${filename.replaceAll('_', '-')}`
  // );

  // Migration
  // await migrateTraits();
  // await migrateBears(300);

  // Test layering a Bear
  // await composeBear(202);
  await composeBears(100);
}

// ============================================================================
// Migrate Traits (from Traits Asset Folder)
// ============================================================================

async function migrateTraits() {
  // Logging
  const timetaken = 'Time taken migrating Categories and Traits';
  console.log('--- Start migrating Traits ---');
  console.time(timetaken);

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
      const traitAssetVariants = await generateTraitAssetVariants(
        traitAsset,
        traitName
      );

      // Save Trait Asset Variatns to File System (for testing)
      const traitAssetVariantPaths = await saveTraitAssetVariantsToFileSystem(
        traitAssetVariants,
        pathToParsedTraitsFolder,
        id
      );

      // TODO Upload Trait to Github

      // Create Trait in DB
      await db.trait.create({
        data: {
          id,
          name: traitName,
          category_id: categoryId,
          image_url_webp: traitAssetVariantPaths.webp,
          image_url_png_2000x2000: traitAssetVariantPaths.png2000x2000,
          image_url_png_512x512: traitAssetVariantPaths.png512x512,
          depending_on_traits:
            traitDependencyId != null
              ? {
                  create: {
                    depending_on_trait_id: traitDependencyId,
                  },
                }
              : undefined,
        },
      });

      console.log(`Processed: '${traitName}'`);
    }
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Traits ---');
}

// ============================================================================
// Migrate Bears (from CSV)
// ============================================================================

async function migrateBears(until: number) {
  // Logging
  const timetaken = 'Time taken migrating Bears';
  console.log('--- Start migrating Bears ---');
  console.time(timetaken);

  // Read CSV Data
  const file = await readFile(
    path.join(appConfig.rootPath, 'local/bear_attributes.csv')
  );
  const parsedData = parseCSVFile(file, ',').slice(0, until);

  for (const row of parsedData) {
    const bearId = generateUUID();
    // Extract Bear Index at Colum 'Name' before processing Traits
    const bearIndex = row['Name'] != null ? +row['Name'] : -1;
    delete row['Name'];

    // Retrieve corresponding Traits form the Database
    const traits: Record<string, TQueryTraitInformationResponse | null> = {};
    for (const categoryKey of Object.keys(row)) {
      const traitKey = row[categoryKey];
      if (traitKey != null) {
        traits[categoryKey] = await queryTraitInformation(
          traitKey,
          categoryKey,
          traits['Fur']?.traitId
        );
      }
    }

    // Create new Bear Entry in the Database
    await db.bear.create({
      data: {
        id: bearId,
        index: bearIndex,
      },
    });

    // Connect Bear Entry with corresponding Traits
    for (const traitKey of Object.keys(traits)) {
      const trait = traits[traitKey];
      if (trait != null) {
        await db.bear_Trait.create({
          data: {
            layer_id: trait.layerId,
            bear_id: bearId,
            trait_id: trait.traitId,
          },
        });
      }
    }

    console.log(`Processed: '${bearIndex}'`);
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Bears ---');
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
    .replace('.png', '') // Replace ending
    .split(chainChar); // e.g. 'closed-albino', 'open-lofi'
  let dependency: null | string = null;
  let newName = name;

  try {
    // Format Name
    if (parts[0] != null) {
      newName = `${parts[0]}_${parts[1] || ''}`; // Add Dependency Name back to Display Name

      // Remove or replace not required Chars
      newName = newName
        .toLowerCase()
        .replace(new RegExp(`/^(${categoryName.toLowerCase()})/`), '') // Replace Category Name (e.g. fur_happy.png -> _happy.png)
        .replace(spaceChar, ' ')
        .replace(/[^a-zA-Z ]/g, '') // Replace any special Char
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
      newName = parts[1];

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
    if (!fast) {
      png512x512 = await sharp(traitAsset).resize(512, 512).toBuffer();
      webp = await sharp(traitAsset).webp().toBuffer();
    }
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

async function queryTraitInformation(
  traitKey: string,
  categoryKey: string,
  furId = 'unknown'
): Promise<TQueryTraitInformationResponse | null> {
  // In the .csv Trait Names are specified as e.g. 'Army Hat' but in the DB as 'Armyhat'
  traitKey = traitKey.toLowerCase().replace(/ /g, '');

  // For debugging
  // setLogging(true);

  // https://github.com/prisma/prisma/discussions/3159
  // Note: '{value}' is for Values (but only hard coded!!)
  //   and "{name}" is for Table or Column Names
  const response = await db.$queryRaw<TQueryTraitInformationResponse[]>`
      SELECT t.id AS "traitId", t.name AS "traitName", 
      c.id AS "categoryId", c.name AS "categoryName", 
      l.id AS "layerId", l.index AS "layerIndex",
      dt.depending_on_trait_id
      FROM "public"."Trait" AS t
      LEFT JOIN "public"."Category" AS c
      ON t.category_id = c.id
      LEFT JOIN "public"."Layer" AS l
      ON c.layer_id = l.id
      LEFT JOIN "public"."Dependent_Trait" AS dt
      ON t.id = dt.trait_id
      WHERE LOWER(t.name) LIKE ${`${traitKey}%`}
      AND c.name = ${categoryKey}
      AND (
        dt.depending_on_trait_id IS NULL
        OR dt.depending_on_trait_id = ${furId}
      )
      `;

  return response.length >= 1 ? response[0] : null;
}

async function composeBears(until: number) {
  for (let i = 1; i < until; i++) {
    await composeBear(i);
  }
}

async function composeBear(index: number) {
  // Logging
  const timetaken = 'Time taken generating Bear';
  console.log('--- Start generating Bear ---');
  console.time(timetaken);

  // Query Bear
  const bear = await db.bear.findFirst({
    where: {
      index,
    },
  });

  if (bear != null) {
    // Query Traits
    const traits = await findTraitsByBearId(bear.id);
    // Order Traits based on layer index
    const orderedTraits = traits.sort(
      (a, b) => a.category.layer.index - b.category.layer.index
    );

    // Generate composed Bear
    if (orderedTraits.length > 0) {
      // Read composable Trait Assets
      const composableTraits: OverlayOptions[] = [];
      for (const trait of orderedTraits) {
        if (trait.image_url_png_2000x2000 != null) {
          const buffer = await readFile(trait.image_url_png_2000x2000);
          composableTraits.push({ input: buffer });
        }
      }

      // Compose Bear based on Trait Assets
      if (composableTraits.length >= 1) {
        const composedBear = await sharp(
          composableTraits.shift()?.input as Buffer
        )
          .png()
          .composite(composableTraits)
          .toBuffer();

        // Save composed Bear
        await writeFile(
          `${pathToGeneratedBearTests}/${bear.index}.png`,
          composedBear
        );
      }
    }

    console.log(`Generated Asset for Bear '${bear.index}'`, { bear, traits });
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End generating Bear ---');
}

async function findTraitsByBearId(bearId: string) {
  return db.trait.findMany({
    where: {
      bears: {
        some: {
          bear_id: bearId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      image_url_png_2000x2000: true,
      image_url_png_512x512: true,
      image_url_webp: true,
      category: {
        select: {
          layer: {
            select: {
              index: true,
            },
          },
        },
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

type TQueryTraitInformationResponse = {
  traitId: string;
  traitName: string;
  categoryId: string;
  categoryName: string;
  layerId: string;
  layerIndex: string;
};
