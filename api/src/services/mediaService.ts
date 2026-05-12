import { uploadImage } from '../lib/cloudinary';

export async function uploadPhoto(buffer: Buffer, folder: string): Promise<string> {
  return uploadImage(buffer, folder);
}
