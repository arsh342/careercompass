
import { NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string;
    const opportunityId = formData.get('opportunityId') as string | null;
    const fileName = formData.get('fileName') as string;

    if (!file || !userId || !fileName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    let filePath = `resumes/${userId}/${fileName}`;
    if (opportunityId && opportunityId !== 'undefined' && opportunityId !== 'null') {
        filePath = `resumes/${userId}/${opportunityId}/${fileName}`;
    }

    const storageRef = ref(storage, filePath);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const snapshot = await uploadBytes(storageRef, buffer, {
        contentType: file.type,
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ url: downloadURL });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}
