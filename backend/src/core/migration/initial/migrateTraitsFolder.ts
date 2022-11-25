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
  const toResolveTraitDependency: {
    id: string;
    slug: string;
    dependencies: (string | TDeepDependency)[];
  }[] = [];
  const toResolveTraitVariants: {
    id: string;
    slug: string;
    variantOf: string | null;
    variant: string | null;
  }[] = [];

  for (const categoryDirKey of categoryDirKeys) {
    const {
      name: categoryName,
      slug: categorySlug,
      options: categoryOptions,
    } = formatFileName(categoryDirKey);
    const layerIndex = categoryOptions.layer;
    if (layerIndex == null) {
      console.error('Each category requires a Layer Index!!', {
        category: categoryDirKey,
      });
      return;
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
      } = formatFileName(traitAssetKey);
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
      const trait = await db.trait.create({
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

      // Add possible relations to 'toResolveTraitRelations' to resolve them
      // as soon as all Traits were migrated (-> Trait doesn't depend on Trait that wasn't migrated yet)
      if (traitOptions.dependencies.length > 0) {
        toResolveTraitDependency.push({
          id: trait.id,
          slug: trait.slug,
          dependencies: traitOptions.dependencies,
        });
      }
      if (traitOptions.variant != null) {
        toResolveTraitVariants.push({
          id: trait.id,
          slug: trait.slug,
          variantOf: traitOptions.variantOf,
          variant: traitOptions.variant,
        });
      }

      console.log(`Processed: '${traitName}'`);
    }
  }

  // TODO Figure out how to avoid establishing wrong dependencies.
  // e.g. 'Green Fur' and 'Green Background' confusion
  // 'okay_d+green.png' -> Might think it depends on 'Green Background' and not 'Green Fur'
  //
  // 1. Add category name to slug (okay, but it requires even complexer renaming)
  // 2. Query with CategoryId as Parameter (not possible as we just know 'green' but not which Category)

  // Handle Variant Relations
  for (const relation of toResolveTraitVariants) {
    // Query Variant Parent
    let variantParentTraitId: string | null = null;
    if (relation.variantOf != null) {
      const trait = await findTraitBySlug(relation.variantOf);
      variantParentTraitId = trait?.id ?? null;
    }

    // Create DB Relation
    if (variantParentTraitId != null) {
      await db.trait_Variant.create({
        data: {
          trait_id: relation.id,
          variant_of_trait_id: variantParentTraitId,
          name: formatName(`${relation.variant} ${relation.variantOf}`),
          slug: relation.variant ?? 'unknown',
        },
      });
    }
  }

  // Handle Dependency Relations
  for (const relation of toResolveTraitDependency) {
    const dependencyTraitIds: string[] = [];
    for (const dependency of relation.dependencies) {
      // Handle Shallow Dependency
      if (typeof dependency === 'string') {
        const trait = await findTraitBySlug(dependency);
        const traitId = trait?.id;
        if (traitId != null) {
          dependencyTraitIds.push(traitId);
        }
      }
      // Handle Deep Dependency
      else {
        // Find all Variants of a Dependency,
        // as if a Trait depends on the Parent it depends also in its Variants
        // e.g. :
        // blackbuckethat_d+(fur_v+noears).png
        // {
        //   name: 'Fur Noears',
        //   slug: 'fur-noears',
        //   variant: 'noears',
        //   variantOf: 'fur',
        // },
        if (dependency.variant != null && dependency.variantOf != null) {
          const traitVariants = await db.trait_Variant.findMany({
            where: {
              slug: {
                equals: dependency.variant,
                mode: 'insensitive',
              },
              trait: {
                category: {
                  slug: {
                    equals: dependency.variantOf,
                    mode: 'insensitive',
                  },
                },
              },
            },
            select: {
              trait_id: true,
            },
          });
          for (const traitVariant of traitVariants) {
            dependencyTraitIds.push(traitVariant.trait_id);
          }
        }
      }
    }

    // Create DB Relations
    for (const dependencyTraitId of dependencyTraitIds) {
      await db.trait_Dependency.create({
        data: {
          trait_id: relation.id,
          depending_on_trait_id: dependencyTraitId,
        },
      });
    }
  }

  // TODO Add Trait Combinations

  // Logging
  console.timeEnd(timetaken);
  console.log('--- End migrating Traits ---');
}

// ============================================================================
// Helper
// ============================================================================

function formatFileName(name: string): {
  name: string;
  slug: string;
  options: TChainedNameOptions;
} {
  // Split at every '+' but avoid splitting in brackets '()' -> /[+]+(?![^(]*\))/g
  // Based on: https://stackoverflow.com/questions/9219072/how-to-let-regex-ignore-everything-between-brackets
  const splitInnerChainPartsExpression = new RegExp(
    `[${config.separator.chainType}]+(?![^${config.separator.deepChainStart}]*\\${config.separator.deepChainEnd})`,
    'g'
  );
  const splitChainPartsExpression = new RegExp(
    `[${config.separator.chain}]+(?![^${config.separator.deepChainStart}]*\\${config.separator.deepChainEnd})`,
    'g'
  );

  // Split Name into Chain Parts
  const chainParts = name
    .replace(/^.+\//, '') // Replace everything until the last '/' occurrence belonging to the path -> 'closed/closed-albino' -> 'closed-albino'
    .replace('.png', '') // Replace file ending (if asset)
    .split(new RegExp(splitChainPartsExpression));
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
      const chainInnerParts = chainPart.split(splitInnerChainPartsExpression);
      if (chainInnerParts.length === 2) {
        const chainIdentifier = chainInnerParts[0];
        const chainValue = nameToSlug(chainInnerParts[1]);

        // Handle Variant
        if (chainIdentifier === 'v' && options.variant == null) {
          options.variant = chainValue;
          options.variantOf = nameToSlug(newName);
        }

        // Handle Dependency
        if (chainIdentifier === 'd') {
          // Handle Deep Chain
          if (
            chainValue.startsWith(config.separator.deepChainStart) &&
            chainValue.endsWith(config.separator.deepChainEnd)
          ) {
            const formattedChainValue = formatFileName(chainValue.slice(1, -1));
            options.dependencies.push({
              name: formattedChainValue.name,
              slug: formattedChainValue.slug,
              variant: formattedChainValue.options.variant,
              variantOf: formattedChainValue.options.variantOf,
            });
          }
          // Handle Shallow Chain
          else {
            options.dependencies.push(chainValue);
          }
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
      typeof options.dependencies[0] === 'string'
        ? `${config.separator.space}${options.dependencies[0]}`
        : ''
    }`; // Add Dependency Name back to Display Name

    // Format Name
    newName = formatName(newName);
  } catch (err) {
    console.error(`Failed to parse Trait Name '${name}'!`);
  }

  return {
    options,
    name: newName,
    slug: nameToSlug(newName),
  };
}

function formatName(name: string): string {
  // Remove or replace not required Chars
  let newName = name
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

  return newName;
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(' ', config.separator.space);
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
      slug: {
        equals: nameToSlug(slugOrName),
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });
  return response?.id ?? null;
}

async function findTraitBySlug(slugOrName: string): Promise<Trait | null> {
  return db.trait.findFirst({
    where: {
      slug: {
        equals: nameToSlug(slugOrName),
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
  dependencies: (TDeepDependency | string)[];
  layer: number | null;
  category: string | null;
};

type TDeepDependency = {
  name: string;
  slug: string;
  variant: string | null;
  variantOf: string | null;
};
