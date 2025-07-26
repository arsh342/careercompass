
import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string;
    const opportunityId = formData.get('opportunityId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !userId || !fileName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    let storagePath = `resumes/${userId}/${fileName}`;
    if (opportunityId && opportunityId !== 'undefined') { // Check for undefined string
        storagePath = `resumes/${userId}/${opportunityId}/${fileName}`;
    }

    const storageRef = ref(storage, storagePath);

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    const url = await getDownloadURL(storageRef);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}
