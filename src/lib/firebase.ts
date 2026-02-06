import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const REQUIRED_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
]

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.VITE_FIREBASE_APP_ID ?? "",
}

function logMissingFirebaseEnv(missingKeys: string[]) {
  const message = `Firebase env vars missing: ${missingKeys.join(", ")}`
  console.warn(message)
  if (process.env.NODE_ENV !== "production") {
    console.error(message)
  }
}

export function isFirebaseConfigured(): boolean {
  return REQUIRED_ENV_KEYS.every((key) => Boolean(process.env[key]))
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key])
    logMissingFirebaseEnv(missingKeys)
    return null
  }

  try {
    if (getApps().length > 0) {
      return getApps()[0]
    }

    return initializeApp(firebaseConfig)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to initialize Firebase app.", error)
    }
    console.warn("Firebase app initialization failed; auth disabled.")
    return null
  }
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp()
  if (!app) return null
  try {
    return getAuth(app)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to initialize Firebase auth.", error)
    }
    console.warn("Firebase auth unavailable; sign-in disabled.")
    return null
  }
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp()
  if (!app) return null
  try {
    return getFirestore(app)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to initialize Firestore.", error)
    }
    console.warn("Firestore unavailable; user sync disabled.")
    return null
  }
}
