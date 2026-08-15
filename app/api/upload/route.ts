import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

const BUCKET = process.env.R2_BUCKET_NAME!;
const SIZES = [
  { name: "thumb", width: 400 },
  { name: "medium", width: 1200 },
];

/**
 * Accepts a raw image upload (multipart form), resizes it server-side into
 * a thumbnail and a medium size (plus the original), and pushes all three
 * to R2. Trades a bit of server compute for much smaller files served to
 * users on slow connections — worth it for a photo-heavy listings site.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string | null;

    if (!file || !propertyId) {
      return NextResponse.json({ error: "file and propertyId are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const results: Record<string, string> = {};

    // Original (capped at 2000px wide so no one accidentally uploads a 12MB photo untouched)
    const original = await sharp(buffer).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const originalKey = `properties/${propertyId}/${id}-original.webp`;
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: originalKey, Body: original, ContentType: "image/webp" }));
    results.original = `${process.env.R2_PUBLIC_URL}/${originalKey}`;

    for (const size of SIZES) {
      const resized = await sharp(buffer).rotate().resize({ width: size.width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      const key = `properties/${propertyId}/${id}-${size.name}.webp`;
      await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: resized, ContentType: "image/webp" }));
      results[size.name] = `${process.env.R2_PUBLIC_URL}/${key}`;
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Resize/upload failed:", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}

