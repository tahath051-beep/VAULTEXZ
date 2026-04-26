// AWS S3 — PDF/Excel report storage
// Reports are stored as: reports/{tenantId}/{date}/{reportType}.{ext}

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region:      process.env.AWS_REGION      || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.S3_BUCKET || 'forex-accounting-reports';

export async function uploadReport(
  tenantId:    string,
  date:        string,
  reportType:  string,
  ext:         'pdf' | 'xlsx',
  body:        Buffer
): Promise<string> {
  const key = `reports/${tenantId}/${date}/${reportType}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));

  return key;
}

// Pre-signed URL valid for 1 hour (download link sent to user)
export async function getReportUrl(key: string, ttlSeconds = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: ttlSeconds }
  );
}
