import { readFileSync } from 'fs';
import { basename } from 'path';
import { BaseClient } from '../base-client.js';
import type { FileUploadResult } from '../../types/index.js';

export class FileService extends BaseClient {
  async upload(filePath: string): Promise<FileUploadResult> {
    const client = this.getClient();
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const fileName = basename(filePath);
    const fileContent = readFileSync(filePath);

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
      ),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await client.post<FileUploadResult>('upload-file', body, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });
    return response.data;
  }
}
