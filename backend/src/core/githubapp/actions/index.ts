import path from 'path';
import { readFile } from '../../file';
import githubApp from '../app';

export async function uploadFileTest() {
  const imagePath = path.join(__dirname, 'example.png');
  const buffer = await readFile(imagePath);
  const content = buffer.toString('base64');

  githubApp.octokit.rest.repos.createOrUpdateFileContents({
    owner: 'okbcommunity',
    repo: 'dressing-room-cms',
    message: 'Adding an image to the repo',
    path: 'example.png',
    content,
  });
}
