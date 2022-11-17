import path from 'path';
import appConfig from '../../../config/app.config';
import githubConfig from '../../../config/github.config';
import { readFile } from '../../file';
import { getInstallationOctokit } from '../app';
import { components } from '@octokit/openapi-types';

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

export async function uploadOrUpdateFile(
  path: string,
  buffer: Buffer,
  options: TGetAndUploadOptions = {}
) {
  const content = buffer.toString('base64');
  const installationOctokit = await getInstallationOctokit();

  // Check wether to upload File already exists.
  // If so retreive the sha to update the corresponding file.
  const file = await getFile(path, options);

  installationOctokit.rest.repos.createOrUpdateFileContents({
    owner: githubConfig.repo.owner,
    repo: githubConfig.repo.name,
    message: `Added file to '${path}'.`,
    path,
    content,
    branch: options.branch,
    sha: file?.sha,
  });
}

export async function getFile(
  path: string,
  options: TGetAndUploadOptions = {}
) {
  const content = await getContent(path, options);
  if (content != null && !Array.isArray(content) && content?.type === 'file') {
    return content;
  }
  return null;
}

export async function getContent(
  path: string,
  options: TGetAndUploadOptions = {}
): Promise<TDirectoryItem | TDirectoryItem[] | null> {
  const installationOctokit = await getInstallationOctokit();
  const response = await installationOctokit.rest.repos.getContent({
    owner: githubConfig.repo.owner,
    repo: githubConfig.repo.name,
    path,
    ref: options.branch,
  });
  if (response.status !== 200) {
    return null;
  }
  return response.data;
}

export async function removeContent(
  path: string,
  options: TGetAndUploadOptions = {}
) {
  const installationOctokit = await getInstallationOctokit();

  // Check whether File exists
  const file = await getFile(path, options);

  if (file != null) {
    // TODO return something to see wheter file was deleted successful, existed, or failed
    await installationOctokit.rest.repos.deleteFile({
      owner: githubConfig.repo.owner,
      repo: githubConfig.repo.name,
      path,
      message: `Deleted file '${path}'`,
      sha: file.sha,
    });
  }
}

type TDirectoryItem = components['schemas']['content-directory'][number];

type TGetAndUploadOptions = {
  branch?: string;
};
