abstract class UploadService {
  abstract upload(path: string, buffer: Buffer): Promise<boolean>;

  abstract update(path: string, newBuffer: Buffer): Promise<boolean>;

  abstract remove(path: string): Promise<boolean>;
}
