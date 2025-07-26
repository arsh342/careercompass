
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

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
    
    let public_id = `resumes/${userId}/${fileName}`;
    if (opportunityId && opportunityId !== 'undefined' && opportunityId !== 'null') {
        public_id = `resumes/${userId}/${opportunityId}/${fileName}`;
    }

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id,
                resource_type: 'raw',
                folder: 'resumes'
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(buffer);
    });
    
    // @ts-ignore
    const { secure_url } = result;

    return NextResponse.json({ url: secure_url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 });
  }
}
