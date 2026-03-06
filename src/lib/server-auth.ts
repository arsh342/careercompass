import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export interface ServerAuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  profile: Record<string, any> | null;
  role?: string;
}

function ensureAdminServices() {
  if (!adminAuth || !adminDb) {
    throw new Error("Authentication service unavailable");
  }
}

export async function getServerAuthenticatedUser(): Promise<ServerAuthenticatedUser> {
  ensureAdminServices();

  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decodedToken = await adminAuth!.verifyIdToken(token);
  const userDoc = await adminDb!.collection("users").doc(decodedToken.uid).get();
  const profile = userDoc.exists ? (userDoc.data() as Record<string, any>) : null;

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    emailVerified: decodedToken.email_verified,
    profile,
    role: profile?.role,
  };
}

export async function requireServerAuthenticatedUser(): Promise<ServerAuthenticatedUser> {
  return getServerAuthenticatedUser();
}

export async function requireServerRole(
  roles: string | string[]
): Promise<ServerAuthenticatedUser> {
  const user = await getServerAuthenticatedUser();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

