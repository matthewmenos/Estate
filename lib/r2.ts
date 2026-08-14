import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// R2 is S3-compatible, so we point the standard S3 client at R2's endpoint.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * Generates a presigned URL the browser can PUT a file to directly,
 * skipping our server for the actual file bytes.
 */
export async function getPresignedUploadUrl(params: {
  propertyId: string;
  fileName: string;
  contentType: string;
}) {
  const ext = params.fileName.split(".").pop();
  const key = `properties/${params.propertyId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 * 5 }); // 5 min

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}
