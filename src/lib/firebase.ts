"use client"

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

type FirebaseAppModule = {
  getApps: () => unknown[]
  initializeApp: (config: FirebaseWebConfig) => unknown
}

type FirebaseAuthModule = {
  getAuth: (app: unknown) => unknown
  GoogleAuthProvider: new () => { setCustomParameters: (params: Record<string, string>) => void }
  onAuthStateChanged: (
    auth: unknown,
    next: (user: FirebaseUser | null) => void,
    error?: (err: unknown) => void
  ) => () => void
  signInWithPopup: (auth: unknown, provider: unknown) => Promise<void>
  signOut: (auth: unknown) => Promise<void>
}

type FirebaseFirestoreModule = {
  getFirestore: (app: unknown) => unknown
  doc: (db: unknown, collection: string, id: string) => unknown
  setDoc: (ref: unknown, data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>
  serverTimestamp: () => unknown
}

export type FirebaseUser = {
  uid: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

export type FirebaseClient = {
  auth: unknown
  db: unknown | null
  authModule: FirebaseAuthModule
  firestoreModule: FirebaseFirestoreModule | null
}

let firebaseClientPromise: Promise<FirebaseClient | null> | null = null

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

async function loadFirebaseModules(): Promise<{
  appModule: FirebaseAppModule
  authModule: FirebaseAuthModule
  firestoreModule: FirebaseFirestoreModule
}> {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
  ])

  return {
    appModule: appModule as FirebaseAppModule,
    authModule: authModule as FirebaseAuthModule,
    firestoreModule: firestoreModule as FirebaseFirestoreModule,
  }
}

export function getFirebaseClient(): Promise<FirebaseClient | null> {
  if (firebaseClientPromise) return firebaseClientPromise

  if (typeof window === "undefined") {
    return Promise.resolve(null)
  }

  if (!isFirebaseConfigured()) {
    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key])
    logMissingFirebaseEnv(missingKeys)
    return Promise.resolve(null)
  }

  firebaseClientPromise = loadFirebaseModules()
    .then(({ appModule, authModule, firestoreModule }) => {
      const existingApps = appModule.getApps()
      const app = existingApps.length > 0 ? existingApps[0] : appModule.initializeApp(firebaseConfig)
      const auth = authModule.getAuth(app)
      const db = firestoreModule.getFirestore(app)

      return {
        auth,
        db,
        authModule,
        firestoreModule,
      }
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to initialize Firebase modules.", error)
      }
      console.warn("Firebase unavailable; auth disabled.")
      return null
    })

  return firebaseClientPromise
}
