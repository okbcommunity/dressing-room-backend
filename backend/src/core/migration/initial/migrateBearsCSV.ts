import { Prisma } from '@prisma/client';
import path from 'path';
import appConfig from '../../../config/app.config';
import { generateUUID } from '../../../utlis';
import { db } from '../../db';
import { parseCSVFile, readFile } from '../../file';

// ============================================================================
// Migrate Bears (from CSV)
// ============================================================================

export async function migrateBearsCSV(bearsToMigrateCount: number) {
  // Logging
  const timetaken = 'Time taken migrating Bears';
  console.log('--- Start migrating Bears ---');
  console.time(timetaken);

  // Read CSV Data
  const file = await readFile(
    path.join(appConfig.rootPath, 'local/bear_attributes.csv')
  );
  const parsedData = parseCSVFile(file, ',').slice(0, bearsToMigrateCount);

  for (const row of parsedData) {
    const bearId = generateUUID();
    // Extract Bear Index at Colum 'Name' before processing Traits
    const bearIndex = row['Name'] != null ? +row['Name'] : -1;
    delete row['Name'];

    // Retrieve corresponding Traits form the Database
    const traits: Record<string, TQueryTraitInformationResponse | null> = {};
    for (const categoryKey of Object.keys(row)) {
      const traitSlug = row[categoryKey]?.toLocaleLowerCase();
      if (traitSlug != null) {
        traits[categoryKey] = await queryTraitInformation(
          traitSlug,
          categoryKey,
          traits
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
  traitSlug: string,
  categorySlug: string,
  traits: Record<string, TQueryTraitInformationResponse | null>
): Promise<TQueryTraitInformationResponse | null> {
  // In the .csv Trait Names are specified as e.g. 'Army Hat' but in the DB as 'Armyhat'
  traitSlug = traitSlug.toLowerCase().replace(/ /g, '');
  categorySlug = categorySlug.toLowerCase().replace(/ /g, '');

  // For debugging
  // setLogging(true);

  const dependingOnTraitIds = Object.keys(traits).reduce(
    (traitIds: string[], next: string) => {
      const trait = traits[next];
      if (trait != null) {
        console.log('TraitKey', next); // TODO
        traitIds.push(trait.traitId);
      }
      return traitIds;
    },
    // 'Prisma.join' can't work with empty array!
    // Prisma also can't work with deep 'Prisma.join'
    // -> "${dOTI.length > 1 ? `OR xyz = ${Prisma.join(dOTI)}` : Prisma.empty}""
    ['unknown']
  );

  if (categorySlug === 'hat') {
    console.log('hatStuff');
  }

  // Build Query
  // https://github.com/prisma/prisma/discussions/3159
  // Note: '{value}' is for Values (but only hard coded!!)
  //   and "{name}" is for Table or Column Names
  // Good To Know (https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#tagged-template-helpers)
  const response = await db.$queryRaw<TQueryTraitInformationResponse[]>`
      SELECT t.id AS "traitId", t.name AS "traitName", t.slug AS "traitSlug",
      c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
      l.id AS "layerId", l.index AS "layerIndex",
      td.depending_on_trait_id
      FROM "public"."Trait" AS t
      LEFT JOIN "public"."Category" AS c
      ON t.category_id = c.id
      LEFT JOIN "public"."Layer" AS l
      ON c.layer_id = l.id
      LEFT JOIN "public"."Trait_Dependency" AS td
      ON t.id = td.trait_id
      LEFT JOIN "public"."Trait_Variant" AS tv
      ON t.id = tv.trait_id
      WHERE LOWER(t.slug) LIKE ${`${traitSlug}%`}
      AND LOWER(c.slug) = ${categorySlug}
      AND (
        td.depending_on_trait_id IS NULL
        OR td.depending_on_trait_id IN (${Prisma.join(dependingOnTraitIds)})
      )
      AND tv.trait_id IS NULL
      `;

  // TODO Look into Variants
  // if depending_on_trait_id not in xyz

  return response.length >= 1 ? response[0] : null;
}

type TQueryTraitInformationResponse = {
  traitId: string;
  traitName: string;
  categoryId: string;
  categoryName: string;
  layerId: string;
  layerIndex: string;
};
