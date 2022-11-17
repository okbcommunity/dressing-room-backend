import fs from 'fs';

export async function readFile(filepath: string): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, content) => {
      if (err) {
        console.error('Error: Reading File', { filepath });
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
        console.error('Error: Reading Dir', { dirpath });
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

export function isFile(path: string): boolean {
  return fs.lstatSync(path).isFile();
}

export function isDir(path: string): boolean {
  return fs.lstatSync(path).isDirectory();
}
