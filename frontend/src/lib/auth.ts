const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const STORAGE_KEY = "nyt100_tokens";
const VERIFIER_KEY = "nyt100_pkce_verifier";

interface Tokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function base64url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(input: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
}

function randomString(length: number) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer);
}

function redirectUri() {
  return `${window.location.origin}/callback`;
}

export async function login() {
  const verifier = randomString(64);
  const challenge = base64url(await sha256(verifier));
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export function logout() {
  clearTokens();
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: `${window.location.origin}/`,
  });
  window.location.href = `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

export function getTokens(): Tokens | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeTokens(tokens: Tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function handleCallback(code: string) {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier - please sign in again");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error("Token exchange failed");

  const data = await res.json();
  storeTokens({
    id_token: data.id_token,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });
  sessionStorage.removeItem(VERIFIER_KEY);
}

export function isLoggedIn() {
  const tokens = getTokens();
  return !!tokens && tokens.expires_at > Date.now();
}

export function getIdToken() {
  return getTokens()?.id_token ?? null;
}

export function currentUserClaims(): Record<string, string> | null {
  const token = getIdToken();
  if (!token) return null;
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}
