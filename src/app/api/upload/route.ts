import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/api-auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===========================
// FILE UPLOAD SECURITY CONFIG
// ===========================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// 5MB max file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Validate file type by checking magic bytes (file signature)
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  };

  const expectedSignatures = signatures[mimeType];
  if (!expectedSignatures) {
    // For SVG, check if it starts with XML or SVG tag
    if (mimeType === 'image/svg+xml') {
      const start = buffer.slice(0, 100).toString('utf-8').toLowerCase();
      return start.includes('<?xml') || start.includes('<svg');
    }
    return true; // Allow if no signature defined
  }

  return expectedSignatures.some(sig => 
    sig.every((byte, index) => buffer[index] === byte)
  );
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 100);
}

// Get file extension
function getFileExtension(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return ext || '';
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = withRateLimit(req, RATE_LIMITS.upload);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication required for uploads
    const { response: authError, user } = await requireAuth(req);
    if (authError) return authError;

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    // Verify user is uploading for themselves (or use authenticated user's ID)
    const targetUserId = userId || user?.uid;
    
    if (!file || !targetUserId) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Ensure user can only upload to their own folder
    if (user && targetUserId !== user.uid) {
      return NextResponse.json(
        { error: "Cannot upload files for other users" },
        { status: 403 }
      );
    }

    // ===========================
    // SECURITY VALIDATIONS
    // ===========================

    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 2. Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG)" },
        { status: 400 }
      );
    }

    // 3. Check file extension
    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // 4. Validate userId format (prevent path traversal)
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Validate file signature (magic bytes)
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }

    // Sanitize filename for logging
    const safeFilename = sanitizeFilename(file.name);

    // Upload to Cloudinary with secure settings
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `profile-pictures/${userId}`,
            public_id: `${userId}-${Date.now()}`,
            resource_type: "image", // Force image type only
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            transformation: [
              { width: 500, height: 500, crop: "limit" }, // Limit dimensions
              { quality: "auto:good" }, // Optimize quality
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ 
      url: (result as any).secure_url,
      message: "File uploaded successfully"
    });
  } catch (error) {
    console.error("Upload failed:", error);
    // Don't expose internal error details
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
