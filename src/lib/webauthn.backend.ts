import { getApps, initializeApp, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

// Safely load config for Node 22 ESM without import attribute errors
let firebaseConfig: any = {
  projectId: "gen-lang-client-0494418195",
  firestoreDatabaseId: "ai-studio-nourishiqsmartai-c233af30-27a9-4cbc-b3eb-0fa1c66a7a93"
};
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json:", e);
}
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// Initialize Firebase Admin with correct Database ID if not already done
const apps = getApps();
const adminApp = apps.length === 0 ? initializeApp({
  projectId: firebaseConfig.projectId,
}) : getApp();

export const adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
export const adminAuth = getAuth(adminApp);

const RP_NAME = "Nourish IQ";

/**
 * Stores a one-time challenge in Firestore to ensure multi-instance state safety.
 */
async function saveChallenge(key: string, challenge: string) {
  await adminDb.collection("webauthn_challenges").doc(key).set({
    challenge,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Retrieves and deletes a challenge from Firestore to prevent replay attacks.
 */
async function popChallenge(key: string): Promise<string | null> {
  const docRef = adminDb.collection("webauthn_challenges").doc(key);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  // Challenges are valid for 5 minutes
  const createdAt = data?.createdAt?.toDate();
  if (!createdAt || Date.now() - createdAt.getTime() > 5 * 60 * 1000) {
    await docRef.delete();
    return null;
  }
  const challenge = data.challenge;
  await docRef.delete();
  return challenge;
}

/**
 * Generate Registration Options
 */
export async function getRegisterOptions(uid: string, email: string, displayName: string, rpID: string) {
  // Find existing credentials for this user to exclude them from registration
  const biometricsSnap = await adminDb
    .collection("users")
    .doc(uid)
    .collection("biometrics")
    .get();

  const excludeCredentials = biometricsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.credentialID,
      type: "public-key" as const,
      transports: data.transports || [],
    };
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: Buffer.from(uid),
    userName: email,
    userDisplayName: displayName || email,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform", // Native biometrics (FaceID/TouchID)
    },
  });

  // Save challenge for verification
  await saveChallenge(`reg_${uid}`, options.challenge);

  return options;
}

/**
 * Verify Registration Response and save to Firestore
 */
export async function verifyRegister(
  uid: string,
  email: string,
  response: any,
  rpID: string,
  origin: string
) {
  const expectedChallenge = await popChallenge(`reg_${uid}`);
  if (!expectedChallenge) {
    throw new Error("Challenge expired or not found. Please try again.");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed");
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const { id, publicKey, counter } = credential;

  // Convert Uint8Array to Base64url and Base64 respectively for Firestore storage
  const credentialIDBase64url = typeof id === "string" ? id : Buffer.from(id).toString("base64url");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  const biometricData = {
    uid,
    email,
    credentialID: credentialIDBase64url,
    publicKey: publicKeyBase64,
    counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: response.transports || [],
    createdAt: FieldValue.serverTimestamp(),
  };

  // Save to subcollection of the user
  await adminDb
    .collection("users")
    .doc(uid)
    .collection("biometrics")
    .doc(credentialIDBase64url)
    .set(biometricData);

  return { success: true };
}

/**
 * Generate Authentication (Login) Options
 */
export async function getLoginOptions(email: string, rpID: string) {
  if (!email) {
    throw new Error("Email is required for biometric authentication");
  }

  // Find all biometrics registered for this email address across users
  const biometricsSnap = await adminDb
    .collectionGroup("biometrics")
    .where("email", "==", email)
    .get();

  if (biometricsSnap.empty) {
    throw new Error("No biometrics registered for this email. Please sign in with email/password first to set up biometrics.");
  }

  const allowCredentials = biometricsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.credentialID,
      type: "public-key" as const,
      transports: data.transports || [],
    };
  });

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });

  // Save challenge linked to this email
  await saveChallenge(`log_${email}`, options.challenge);

  return options;
}

/**
 * Verify Authentication Response and Mint Custom Firebase Token
 */
export async function verifyLogin(email: string, response: any, rpID: string, origin: string) {
  const expectedChallenge = await popChallenge(`log_${email}`);
  if (!expectedChallenge) {
    throw new Error("Challenge expired or not found. Please try again.");
  }

  const credentialID = response.id;

  // Find the exact biometric record in Firestore by its credentialID subcollection document
  const biometricsSnap = await adminDb
    .collectionGroup("biometrics")
    .where("credentialID", "==", credentialID)
    .get();

  if (biometricsSnap.empty) {
    throw new Error("Device credentials not recognized.");
  }

  const biometricDoc = biometricsSnap.docs[0]!;
  const biometricData = biometricDoc.data();

  // Verify signature using credential block instead of deprecated authenticator
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: biometricData.credentialID,
      publicKey: Buffer.from(biometricData.publicKey, "base64"),
      counter: biometricData.counter || 0,
    },
  });

  if (!verification.verified || !verification.authenticationInfo) {
    throw new Error("Biometric signature verification failed");
  }

  // Update counter in database to prevent replay attacks
  const { newCounter } = verification.authenticationInfo;
  await biometricDoc.ref.update({ counter: newCounter });

  // Authentication succeeded! Mint a custom Firebase token for this user's UID
  const firebaseToken = await adminAuth.createCustomToken(biometricData.uid);

  return {
    success: true,
    token: firebaseToken,
    uid: biometricData.uid,
  };
}
