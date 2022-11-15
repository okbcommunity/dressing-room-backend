import fs from 'fs';

export const readFile = async (filepath: string): Promise<Buffer> => {
  console.info('Info: Start Reading File', filepath);
  return await new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, content) => {
      if (err) {
        console.error('Error: Reading File', { filepath });
        reject(err);
      }
      console.info('Info: End Reading File', { filepath });
      resolve(content);
    });
  });
};

export const readDir = async (dirpath: string): Promise<string[]> => {
  console.info('Info: Start Reading Dir', dirpath);
  return await new Promise((resolve, reject) => {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) {
        console.error('Error: Reading Dir', { dirpath });
        reject(err);
      }
      console.info('Info: End Reading Dir', { dirpath, filenames });
      resolve(filenames);
    });
  });
};

export const readFilesFromDir = async (
  dirpath: string
): Promise<Record<string, Buffer>> => {
  const filesObject: Record<string, Buffer> = {};
  const filesInDir = await readDir(dirpath);
  for (const key in filesInDir) {
    const filename = filesInDir[key];
    const file = await readFile(`${dirpath}${filename}`);
    filesObject[filename] = file;
  }
  return filesObject;
};
