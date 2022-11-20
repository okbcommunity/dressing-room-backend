import path from 'path';
import appConfig from '../../../config/app.config';
import { renameFilesDeep } from '../../file';

export function renameDeep() {
  renameFilesDeep(
    path.join(appConfig.rootPath, 'local/traits'),
    (dirpath, filename) => {
      // let name = filename.replace('.png', '');
      // const parts = name.split('_');
      // if (parts.length === 2) {
      //   name = `${parts[1]}_c+${parts[0]}`;
      // }
      // return `${dirpath}/${name}.png`;

      // if (parts.length === 2) {
      //   name = `${parts[0]}_d+${parts[1]}`;
      // }
      // return `${dirpath}/${name}.png`;

      // return `${dirpath}/${filename.replace('.png', '')}.png`;

      return `${dirpath}/${filename.replace('c+', 'v+')}`;
    }
  );
}
