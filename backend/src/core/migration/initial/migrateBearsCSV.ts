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
    const traitsWithVariants: Record<
      string,
      TQueryTraitInformationResponse[] | null
    > = {};
    for (const categoryKey of Object.keys(row)) {
      const traitSlug = row[categoryKey]?.toLocaleLowerCase();
      if (traitSlug != null) {
        traitsWithVariants[categoryKey] = await queryTraitInformation(
          traitSlug,
          categoryKey,
          traitsWithVariants
        );
      }
    }

    // TODO select correct Variant based on the other queried Traits
    // e.g. If Hat requires Fur without Ears than use that Variant

    // Create new Bear Entry in the Database
    // await db.bear.create({
    //   data: {
    //     id: bearId,
    //     index: bearIndex,
    //   },
    // });

    // Connect Bear Entry with corresponding Traits
    // for (const traitKey of Object.keys(traits)) {
    //   const trait = traits[traitKey];
    //   if (trait != null) {
    //     await db.bear_Trait.create({
    //       data: {
    //         bear_id: bearId,
    //         trait_id: trait.traitId,
    //       },
    //     });
    //   }
    // }

    console.log(`Processed: '${bearIndex}'`);
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Bears ---');
}

async function queryTraitInformation(
  traitSlug: string,
  categorySlug: string,
  traitsWithVariants: Record<string, TQueryTraitInformationResponse[] | null>
): Promise<TQueryTraitInformationResponse[] | null> {
  // In the .csv Trait Names are specified as e.g. 'Army Hat' but in the DB as 'Armyhat'
  traitSlug = traitSlug.toLowerCase().replace(/ /g, '');
  categorySlug = categorySlug.toLowerCase().replace(/ /g, '');

  // For debugging
  // setLogging(true);

  // Extract Ids of the already queried Traits( and its Variants)
  // that the to query Trait might depend on
  const dependingOnTraitIds = Object.keys(traitsWithVariants).reduce(
    (traitIds: string[], next: string) => {
      const traitWithVariants = traitsWithVariants[next];
      if (traitWithVariants != null) {
        for (const trait of traitWithVariants) {
          traitIds.push(trait.traitId);
        }
      }
      return traitIds;
    },
    // 'Prisma.join' can't work with empty array!
    // Prisma also can't work with deep 'Prisma.join'
    // -> "${dOTI.length > 1 ? `OR xyz = ${Prisma.join(dOTI)}` : Prisma.empty}""
    ['unknown']
  );

  // Query Trait (with its Variants) that contains the 'traitSlug'
  // and belongs to the Category at the 'categorySlug'.
  // The queried Trait (with its Variants) has to depend on no Trait
  // or on a Trait that was previously queried (or a variant of it).
  // Since a Trait can depend on a Trait that wasn't yet queried,
  // not found Traits will be queried again,
  // when all other Traits behind this Trait in the row were queried (on which this Trait might depend on)
  //
  // e.g. The Eye 'robot-albino' depends on the Fur 'albino'
  //
  // https://github.com/prisma/prisma/discussions/3159
  // Note: '{value}' is for Values (but only hard coded!!)
  //   and "{name}" is for Table or Column Names
  //
  // Good To Know (https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#tagged-template-helpers)
  const response = await db.$queryRaw<TQueryTraitInformationResponse[]>`
      SELECT t.id AS "traitId", t.name AS "traitName", t.slug AS "traitSlug",
      c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
      l.id AS "layerId", l.index AS "layerIndex",
      tv.variant_of_trait_id AS "variantOfTraitId",
      td.depending_on_trait_id AS "dependingOnTraitId"
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
      `;

  return response.length > 0 ? response : null;
}

type TQueryTraitInformationResponse = {
  traitId: string;
  traitName: string;
  traitSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  layerId: string;
  layerIndex: string;
  variantOfTraitId: string;
  dependingOnTraitId: string;
};
