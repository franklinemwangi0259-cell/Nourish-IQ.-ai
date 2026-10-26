import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { auth } from "./firebase";
import { signInWithCustomToken } from "firebase/auth";

/**
 * Checks if the user's browser and device support native platform-level biometrics (TouchID/FaceID, etc.)
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const isAvailable =
      window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    return !!isAvailable;
  } catch (error) {
    console.error("Error checking biometric platform availability:", error);
    return false;
  }
}

/**
 * Registers a new biometric credential for the currently logged in user
 */
export async function registerBiometricCredential(
  uid: string,
  email: string,
  displayName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const rpID = window.location.hostname;
    const origin = window.location.origin;

    // 1. Get registration options from our server
    const optionsResponse = await fetch(
      `/api/webauthn/register/options?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(
        email
      )}&displayName=${encodeURIComponent(displayName)}&rpID=${encodeURIComponent(rpID)}`
    );

    if (!optionsResponse.ok) {
      const errorData = await optionsResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch biometric registration options.");
    }

    const options = await optionsResponse.json();

    // 2. Trigger native FaceID / TouchID biometric prompt using @simplewebauthn/browser
    const credentialResponse = await startRegistration({
      optionsJSON: options,
    });

    // 3. Send response back to our server to verify and store public key in Firestore
    const verifyResponse = await fetch("/api/webauthn/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        email,
        response: credentialResponse,
        rpID,
        origin,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to verify biometric registration.");
    }

    const verificationResult = await verifyResponse.json();
    if (verificationResult.success) {
      return { success: true, message: "Biometric authentication registered successfully!" };
    } else {
      throw new Error("Biometric registration verification failed.");
    }
  } catch (error: any) {
    console.error("Biometric registration error:", error);
    let errorMsg = error.message || "An error occurred during registration.";
    if (error.name === "NotAllowedError") {
      errorMsg = "Biometric prompt was cancelled or timed out.";
    }
    return { success: false, message: errorMsg };
  }
}

/**
 * Log in a user using WebAuthn / FaceID / TouchID
 */
export async function signInWithBiometrics(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email) {
      throw new Error("Please enter your email to sign in using biometrics.");
    }

    const rpID = window.location.hostname;
    const origin = window.location.origin;

    // 1. Get assertion options from server
    const optionsResponse = await fetch("/api/webauthn/login/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, rpID }),
    });

    if (!optionsResponse.ok) {
      const errorData = await optionsResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate biometric options for this email.");
    }

    const options = await optionsResponse.json();

    // 2. Request assertion signature via FaceID / TouchID
    const assertionResponse = await startAuthentication({
      optionsJSON: options,
    });

    // 3. Verify on server and get Firebase Custom Auth Token
    const verifyResponse = await fetch("/api/webauthn/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        response: assertionResponse,
        rpID,
        origin,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Biometric login verification failed.");
    }

    const result = await verifyResponse.json();
    if (result.success && result.token) {
      // 4. Authenticate client with Firebase Auth using minted Custom Token
      await signInWithCustomToken(auth, result.token);
      return { success: true, message: "Signed in successfully with biometrics!" };
    } else {
      throw new Error("Biometric verification did not return an authentication token.");
    }
  } catch (error: any) {
    console.error("Biometric sign-in error:", error);
    let errorMsg = error.message || "Biometric authentication failed.";
    if (error.name === "NotAllowedError") {
      errorMsg = "Biometric authentication was cancelled.";
    }
    return { success: false, message: errorMsg };
  }
}
