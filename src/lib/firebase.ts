"use client"

type FirebaseAuthModule = {
  getAuth: (app: unknown) => unknown
  GoogleAuthProvider: new () => {
    setCustomParameters: (params: Record<string, string>) => void
  }
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
  setDoc: (
    ref: unknown,
    data: Record<string, unknown>,
    options?: { merge: boolean }
  ) => Promise<void>
  serverTimestamp: () => unknown
}

type FirebaseAppModule = {
  initializeApp: (config: FirebaseWebConfig) => unknown
  getApps: () => unknown[]
}

export type FirebaseUser = {
  uid: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
}

export type FirebaseClient = {
  auth: unknown
  db: unknown
  authModule: FirebaseAuthModule
  firestoreModule: FirebaseFirestoreModule
}

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
}

const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
}

const REQUIRED_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
]

let firebaseClient: FirebaseClient | null = null
let initPromise: Promise<FirebaseClient | null> | null = null

function hasFirebaseConfig() {
  return REQUIRED_KEYS.every((key) => Boolean(process.env[key]))
}

async function loadModules() {
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

export async function getFirebaseClient(): Promise<FirebaseClient | null> {
  if (firebaseClient) return firebaseClient
  if (initPromise) return initPromise
  if (typeof window === "undefined") return null
  if (!hasFirebaseConfig()) return null

  initPromise = loadModules()
    .then(({ appModule, authModule, firestoreModule }) => {
      const existing = appModule.getApps()
      const app = existing.length > 0
        ? existing[0]
        : appModule.initializeApp(firebaseConfig)
      const auth = authModule.getAuth(app)
      const db = firestoreModule.getFirestore(app)

      firebaseClient = {
        auth,
        db,
        authModule,
        firestoreModule,
      }

      return firebaseClient
    })
    .catch(() => null)

  return initPromise
}
