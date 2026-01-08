import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK only when credentials are available
let adminDb: Firestore | null = null;
let app: App | null = null;

function initializeFirebaseAdmin() {
  // Check if already initialized
  if (getApps().length > 0) {
    app = getApps()[0];
    adminDb = getFirestore(app);
    return;
  }

  // Check if credentials are available
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials not configured. Some features may not work.");
    return;
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    adminDb = getFirestore(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export { adminDb };
