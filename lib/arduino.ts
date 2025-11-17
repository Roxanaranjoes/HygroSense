const tokenUrl = process.env.ARDUINO_TOKEN_URL;
const clientId = process.env.ARDUINO_CLIENT_ID;
const clientSecret = process.env.ARDUINO_CLIENT_SECRET;
const audience =
  process.env.ARDUINO_AUDIENCE ?? "https://api2.arduino.cc/iot";

if (!tokenUrl || !clientId || !clientSecret) {
  throw new Error(
    "Missing Arduino OAuth environment variables. Please set ARDUINO_TOKEN_URL, ARDUINO_CLIENT_ID and ARDUINO_CLIENT_SECRET."
  );
}

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

async function requestArduinoToken(): Promise<CachedToken> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId!,
    client_secret: clientSecret!,
    audience,
  });

  const response = await fetch(tokenUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Arduino OAuth token request failed with ${response.status}`);
  }

  const payload = await response.json();
  const accessToken = payload?.access_token;
  const expiresInSeconds = Number(payload?.expires_in ?? 0);

  if (!accessToken) {
    throw new Error("Arduino OAuth token response missing access_token");
  }

  const expiresAt =
    Date.now() + Math.max(0, (expiresInSeconds ? expiresInSeconds - 30 : 300)) * 1000;

  return { token: accessToken, expiresAt };
}

export async function getArduinoAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  cachedToken = await requestArduinoToken();
  return cachedToken.token;
}
