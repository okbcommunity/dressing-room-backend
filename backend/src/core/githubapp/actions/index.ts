import path from 'path';
import appConfig from '../../../config/app.config';
import { readFile } from '../../file';
import { getInstallationOctokit } from '../app';

export async function uploadFileTest() {
  const imagePath = path.join(appConfig.rootPath, 'example.png');
  const buffer = await readFile(imagePath);
  const content = buffer.toString('base64');
  const installationOctokit = await getInstallationOctokit();

  installationOctokit.rest.repos.createOrUpdateFileContents({
    owner: 'okbcommunity',
    repo: 'dressing-room-cms',
    message: 'Adding an image to the repo',
    path: 'example.png',
    content,
  });
}
