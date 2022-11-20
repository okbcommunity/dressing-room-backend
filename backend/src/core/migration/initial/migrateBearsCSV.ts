import path from 'path';
import sharp, { OverlayOptions } from 'sharp';
import appConfig from '../../../config/app.config';
import { generateUUID } from '../../../utlis';
import { db } from '../../db';
import { parseCSVFile, readFile, writeFile } from '../../file';
import { config } from './config';

// ============================================================================
// Migrate Bears (from CSV)
// ============================================================================

export async function migrateBearsCSV(until: number) {
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
          `${config.path.generatedBears}/${bear.index}.png`,
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

type TQueryTraitInformationResponse = {
  traitId: string;
  traitName: string;
  categoryId: string;
  categoryName: string;
  layerId: string;
  layerIndex: string;
};
