
import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    const userId = fields.userId?.[0];

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 });
    }

    const fileBuffer = fs.readFileSync(file.filepath);

    const storageRef = ref(storage, `profile-pictures/${userId}/${file.originalFilename}`);
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: file.mimetype || undefined,
    });
    
    const url = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
