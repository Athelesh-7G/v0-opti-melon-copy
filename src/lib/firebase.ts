export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface GoogleAuthResult {
  accessToken?: string
  idToken?: string
  code?: string
  state?: string
}

const GOOGLE_SCOPES = ["openid", "email", "profile"]

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

export function buildGoogleOAuthUrl(state: string): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ??
    (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token id_token",
    scope: GOOGLE_SCOPES.join(" "),
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
    nonce: state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function parseGoogleHash(hash: string): GoogleAuthResult {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash
  const params = new URLSearchParams(normalizedHash)

  return {
    accessToken: params.get("access_token") ?? undefined,
    idToken: params.get("id_token") ?? undefined,
    code: params.get("code") ?? undefined,
    state: params.get("state") ?? undefined,
  }
}
