import fs from 'fs';

export async function readFile(filepath: string): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, content) => {
      if (err) {
        console.error('Error while reading File!', { filepath });
        reject(err);
      }
      resolve(content);
    });
  });
}

export async function readDir(dirpath: string): Promise<string[]> {
  return await new Promise((resolve, reject) => {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) {
        console.error('Error while reading Dir!', { dirpath });
        reject(err);
      }
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

    // Read shallow File
    if (isFile(`${dirpath}/${filename}`)) {
      const file = await readFile(`${dirpath}/${filename}`);
      filesObject[filename] = file;
    }
    // Read deep if Folder
    else if (deep && isDir(`${dirpath}/${filename}`)) {
      const deepFiles = await readFilesFromDir(`${dirpath}/${filename}`, true);
      for (const deepFileKey of Object.keys(deepFiles)) {
        filesObject[`${filename}/${deepFileKey}`] = deepFiles[deepFileKey];
      }
    }
  }

  return filesObject;
}

export async function writeFile(filepath: string, data: Buffer): Promise<void> {
  return await new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, (err) => {
      if (err) {
        console.log('Error while writing File!', { filepath });
        reject(err);
      }
      resolve();
    });
  });
}

export async function writeDir(dirpath: string): Promise<void> {
  return await new Promise((resolve, reject) => {
    fs.mkdir(dirpath, { recursive: true }, (err) => {
      if (err) {
        console.log('Error while writing Dir!', { dirpath });
        reject(err);
      }
      resolve();
    });
  });
}

export function isFile(path: string): boolean {
  return fs.lstatSync(path).isFile();
}

export function isDir(path: string): boolean {
  return fs.lstatSync(path).isDirectory();
}

export async function renameFilesDeep(
  dirpath: string,
  rename: (dirpath: string, filename: string) => string
) {
  const filesInDir = await readDir(dirpath);

  for (const key in filesInDir) {
    const filename = filesInDir[key];
    // Read shallow File
    if (isFile(`${dirpath}/${filename}`)) {
      fs.rename(`${dirpath}/${filename}`, rename(dirpath, filename), () => {});
    }
    // Read deep if Folder
    else if (isDir(`${dirpath}/${filename}`)) {
      await renameFilesDeep(`${dirpath}/${filename}`, rename);
    }
  }
}
