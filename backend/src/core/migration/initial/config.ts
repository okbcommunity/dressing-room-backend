import path from 'path';
import appConfig from '../../../config/app.config';

// Required Naming pattern
// {name-of-the-trait} (e.g. 'aviator-jacket', 'albino')
//
// Optional Chains
//
// Variant of a Trait
// {name-of-the-trait}_v+{variant} (e.g. 'albino_v+noears', 'aviator-sunglasses_v+left')
//
// Trait depends on another Trait
// {name-of-the-trait}_d+{dependency} (e.g. 'ahh_d+albino')
//
// Trait has specific Layer
// {name-of-the-trait}_l+{layer} (e.g. 'vr-headset_v+right_l+7')
//
// Specify Category of Trait otherwise the parent Folder will be used
// {name-of-the-trait}_c+{name-of-the-category}
//
// Note: These optional Chains can be chained as required
// e.g. 'vr-headset_v+right_d+robot_l+7'

export const config = {
  separator: {
    space: '-',
    chain: '_',
    chainType: '+',
    deepChainStart: '(',
    deepChainEnd: ')',
  },

  path: {
    composedBears: path.join(appConfig.rootPath, 'local/composed'),
    traitsFolder: path.join(appConfig.rootPath, 'local/traits'),
    parsedTraitsFolder: path.join(appConfig.rootPath, 'local/parsedTraits'),
  },

  testRun: true,
  bearsToMigrateCount: 100,
  bearsToMigrate: [2, 10, 44, 36, 65, 100],
  bearsToComposeCount: 100,
  bearsToCompose: [2, 10, 44, 36, 65, 100],

  steps: {
    renameDeep: false,
    migrateTraits: true,
    migrateBears: true,
    composeBears: true,
  },
};
