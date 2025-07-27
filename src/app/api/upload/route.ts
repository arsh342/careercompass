
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

// This is required to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const formidableParse = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> =>
  new Promise((resolve, reject) => {
    const form = formidable({});
    form.parse(req as any, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await formidableParse(req);

    const file = files.file?.[0];
    const userId = fields.userId?.[0];

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: `profile-pictures/${userId}`,
      public_id: file.newFilename,
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
