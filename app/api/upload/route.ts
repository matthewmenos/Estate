import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const { propertyId, fileName, contentType } = await req.json();

    if (!propertyId || !fileName || !contentType) {
      return NextResponse.json(
        { error: "propertyId, fileName, and contentType are required" },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl({
      propertyId,
      fileName,
      contentType,
    });

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("Upload URL generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
