import { removeContent, uploadOrUpdateFile } from '../../githubapp/actions';

class GithubUploadService extends UploadService {
  async upload(path: string, buffer: Buffer): Promise<boolean> {
    await uploadOrUpdateFile(path, buffer);
    return true; // TODO
  }
  async update(path: string, newBuffer: Buffer): Promise<boolean> {
    await uploadOrUpdateFile(path, newBuffer);
    return true; // TODO
  }
  async remove(path: string): Promise<boolean> {
    await removeContent(path);
    return true; // TODO
  }
}

export default new GithubUploadService();
