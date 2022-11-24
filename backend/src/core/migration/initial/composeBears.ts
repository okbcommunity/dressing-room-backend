import sharp, { OverlayOptions } from 'sharp';
import { db } from '../../db';
import { readFile, writeFile } from '../../file';
import { config } from './config';

export async function composeBears(bearsToComposeCount: number) {
  for (let i = 1; i <= bearsToComposeCount; i++) {
    await composeBear(i);
  }
}

export async function composeBear(index: number) {
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
          `${config.path.composedBears}/${bear.index}.png`,
          composedBear
        );
      }
    }

    console.log(`Generated Asset for Bear '${bear.index}'`);
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
