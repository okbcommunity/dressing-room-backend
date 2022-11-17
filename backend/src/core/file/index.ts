import fs from 'fs';

export async function readFile(filepath: string): Promise<Buffer> {
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
}

export async function readDir(dirpath: string): Promise<string[]> {
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
}

export async function readFilesFromDir(
  dirpath: string,
  deep = false
): Promise<Record<string, Buffer>> {
  const filesObject: Record<string, Buffer> = {};
  const filesInDir = await readDir(dirpath);
  for (const key in filesInDir) {
    const filename = filesInDir[key];
    if (isFile(`${dirpath}/${filename}`)) {
      const file = await readFile(`${dirpath}/${filename}`);
      filesObject[filename] = file;
    } else if (deep && isDir(`${dirpath}/${filename}`)) {
      const deepFiles = await readFilesFromDir(`${dirpath}/${filename}`, true);
      for (const deepFileKey of Object.keys(deepFiles)) {
        filesObject[`${filename}/${deepFileKey}`] = deepFiles[deepFileKey];
      }
    }
  }
  return filesObject;
}

export function isFile(path: string): boolean {
  return fs.lstatSync(path).isFile();
}

export function isDir(path: string): boolean {
  return fs.lstatSync(path).isDirectory();
}
