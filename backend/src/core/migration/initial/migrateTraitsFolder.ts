import { Trait } from '@prisma/client';
import sharp from 'sharp';
import { generateUUID } from '../../../utlis';
import { db } from '../../db';
import { readDir, readFilesFromDir, writeFile } from '../../file';
import { config } from './config';

// ============================================================================
// Migrate Traits (from Traits Asset Folder)
// ============================================================================

export async function migrateTraitsFolder() {
  // Logging
  const timetaken = 'Time taken migrating Categories and Traits';
  console.log('--- Start migrating Traits ---');
  console.time(timetaken);

  // Read Traits directory containing Traits Assets in Category directories
  const categoryDirKeys = await readDir(config.path.traitsFolder);

  // Relations to add after migrating all Traits
  const toResolveTraitRelations: {
    id: string;
    slug: string;
    dependencies: string[];
    variantOf: string | null;
  }[] = [];

  for (const categoryDirKey of categoryDirKeys) {
    const {
      name: categoryName,
      slug: categorySlug,
      options: categoryOptions,
    } = formatName(categoryDirKey);
    const layerIndex = categoryOptions.layer;
    if (layerIndex == null) {
      console.error('Each category requires a Layer Index!!', {
        category: categoryDirKey,
      });
      return;
    }

    // TODO REMOVE
    if (!['fur', 'eyes'].includes(categorySlug)) {
      continue;
    }

    // Query or create Layer in DB
    const layerId = await getOrCreateLayer(layerIndex);

    // Create Category in DB
    const categoryId = generateUUID();
    await db.category.create({
      data: {
        id: categoryId,
        name: categoryName,
        slug: categorySlug,
        layer_id: layerId,
      },
    });

    // Logging
    console.log(
      `Started migrating Traits in Category '${categoryName}' Folder.`
    );

    // Read all Trait Assets in Category directory (deep)
    const traitAssets = await readFilesFromDir(
      `${config.path.traitsFolder}/${categoryDirKey}`,
      true
    );

    // Handle Trait Assets
    for (const traitAssetKey of Object.keys(traitAssets)) {
      const traitAsset = traitAssets[traitAssetKey];
      const {
        name: traitName,
        slug: traitSlug,
        options: traitOptions,
      } = formatName(traitAssetKey);
      const traitId = generateUUID();

      // Query Category
      let specifiedCategoryId: string | null = null;
      if (traitOptions.category != null) {
        specifiedCategoryId = await getCategory(traitOptions.category);
      }

      // Query or create Layer in DB
      let specifiedLayerId: string | null = null;
      if (traitOptions.layer != null) {
        specifiedLayerId = await getOrCreateLayer(traitOptions.layer);
      }

      // Add possible relations to 'toResolveTraitRelations' to resolve them
      // as soon as all Traits were migrated (-> Trait doesn't depend on Trait that wasn't migrated yet)
      if (
        traitOptions.dependencies.length > 0 ||
        traitOptions.variant != null
      ) {
        toResolveTraitRelations.push({
          id: traitId,
          slug: traitSlug,
          dependencies: traitOptions.dependencies,
          variantOf: traitOptions.variantOf,
        });
      }

      // Create different Image Variants of the Trait Asset
      const traitAssetVariants = await generateTraitAssetVariants(
        traitAsset,
        traitName
      );

      // Save Trait Asset Variants to the File System (for testing)
      const traitAssetVariantPaths = await saveTraitAssetVariantsToFileSystem(
        traitAssetVariants,
        config.path.parsedTraitsFolder,
        traitId
      );

      // TODO Upload Trait to Github

      // Create Trait in DB
      await db.trait.create({
        data: {
          id: traitId,
          name: traitName,
          slug: traitSlug,
          layer_id: specifiedLayerId ?? layerId, // Use Category Layer if no Layer specified
          category_id: specifiedCategoryId ?? categoryId,
          image_url_webp: traitAssetVariantPaths.webp,
          image_url_png_2000x2000: traitAssetVariantPaths.png2000x2000,
          image_url_png_512x512: traitAssetVariantPaths.png512x512,
        },
      });

      console.log(`Processed: '${traitName}'`);
    }
  }

  // Create Relations between Traits
  for (const relation of toResolveTraitRelations) {
    // Query Trait dependencies
    const dependencyTraitIds: string[] = [];
    for (const dependency of relation.dependencies) {
      const trait = await findTraitBySlug(dependency);
      const traitId = trait?.id;
      if (traitId != null) {
        dependencyTraitIds.push(traitId);
      }
    }

    // Query Variant Parent
    let variantParentTraitId: string | null = null;
    if (relation.variantOf != null) {
      const trait = await findTraitBySlug(relation.variantOf);
      const traitId = trait?.id;
      console.log('----Variant', relation.variantOf, traitId);
      if (traitId != null) {
        variantParentTraitId = traitId;
      }
    }

    // Update DB Trait Entry
    await db.trait.update({
      where: {
        id: relation.id,
      },
      data: {
        depending_on_traits:
          dependencyTraitIds.length > 0
            ? {
                create: dependencyTraitIds.map((id) => ({
                  depending_on_trait_id: id,
                })),
              }
            : undefined,
        variant_of_traits:
          variantParentTraitId != null
            ? {
                create: {
                  variant_of_trait_id: variantParentTraitId,
                  name: `${relation.variantOf?.replace(
                    config.separator.space,
                    ' '
                  )}`, // TODO format Name
                  slug: `${relation.variantOf}${config.separator.chain}${relation.slug}`,
                },
              }
            : undefined,
      },
    });

    // TODO Add Trait Combinations
  }

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Traits ---');
}

// ============================================================================
// Helper
// ============================================================================

function formatName(name: string): {
  name: string;
  slug: string;
  options: TChainedNameOptions;
} {
  const chainParts = name
    .replace(/^.+\//, '') // Replace everything until the last '/' occurrence belonging to the path -> 'closed/closed-albino' -> 'closed-albino'
    .replace('.png', '') // Replace file ending (if asset)
    .split(config.separator.chain); // e.g. 'closed-albino', 'open-lofi'
  let newName = chainParts.shift() ?? name;
  const options: TChainedNameOptions = {
    variant: null,
    variantOf: null,
    dependencies: [],
    layer: null,
    category: null,
  };

  try {
    for (const chainPart of chainParts) {
      const chainInnerParts = chainPart.split('+');
      if (chainInnerParts.length === 2) {
        const chainIdentifier = chainInnerParts[0];
        const chainValue = chainInnerParts[1].toLowerCase().replace(' ', '_');

        // Handle Variant
        if (chainIdentifier === 'v' && options.variant == null) {
          options.variant = chainValue;
          options.variantOf = newName
            .toLowerCase()
            .replace(' ', config.separator.space);
        }

        // Handle Dependency
        if (chainIdentifier === 'd') {
          options.dependencies.push(chainValue);
        }

        // Handle Layer
        if (chainIdentifier === 'l' && options.layer == null) {
          options.layer = +chainValue;
        }

        // Handle Category
        if (chainIdentifier === 'c' && options.category == null) {
          options.category = chainValue;
        }
      } else {
        console.log('Invalid Chain Part provided!', chainPart);
      }
    }

    // Add relevant Chain Parts back to Display Name
    newName = `${newName}${
      options.variant != null
        ? `${config.separator.space}${options.variant}`
        : ''
    }${
      options.dependencies[0] != null
        ? `${config.separator.space}${options.dependencies[0]}`
        : ''
    }`; // Add Dependency Name back to Display Name

    // Remove or replace not required Chars
    newName = newName
      .toLowerCase()
      .replace(config.separator.space, ' ')
      .replace(/[^a-zA-Z ]/g, '') // Replace any special Char
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
    console.error(`Failed to parse Trait Name '${name}'!`);
  }

  return {
    options,
    name: newName,
    slug: newName.toLowerCase().replace(' ', config.separator.space),
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
    if (!config.testRun) {
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

async function getOrCreateLayer(index: number): Promise<string> {
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

async function getCategory(slugOrName: string): Promise<string | null> {
  const response = await db.category.findFirst({
    where: {
      slug: slugOrName.toLowerCase().replace(' ', config.separator.space),
    },
    select: { id: true },
  });
  return response?.id ?? null;
}

async function findTraitBySlug(slugOrName: string): Promise<Trait | null> {
  return await db.trait.findFirst({
    where: {
      slug: {
        equals: slugOrName.toLowerCase().replace(' ', config.separator.space),
        mode: 'insensitive',
      },
    },
  });
}

// ============================================================================
// Types
// ============================================================================

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

type TChainedNameOptions = {
  variant: string | null;
  variantOf: string | null;
  dependencies: string[];
  layer: number | null;
  category: string | null;
};
