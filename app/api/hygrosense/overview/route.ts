import { NextResponse } from "next/server";
import openai from "@/lib/openai";
import { getArduinoAccessToken } from "@/lib/arduino";

const {
  ARDUINO_API_BASE_URL,
  ARDUINO_THING_ID,
  ARDUINO_PROPERTY_ID,
  ARDUINO_TEMPERATURE_PROPERTY_ID,
} =
  process.env;

function ensureEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const baseUrl = ensureEnv(ARDUINO_API_BASE_URL, "ARDUINO_API_BASE_URL");
const thingId = ensureEnv(ARDUINO_THING_ID, "ARDUINO_THING_ID");
const humidityPropertyId = ensureEnv(
  ARDUINO_PROPERTY_ID,
  "ARDUINO_PROPERTY_ID"
);
const temperaturePropertyId = ensureEnv(
  ARDUINO_TEMPERATURE_PROPERTY_ID,
  "ARDUINO_TEMPERATURE_PROPERTY_ID"
);

async function fetchArduinoPropertyValue(propertyId: string) {
  const url = `${baseUrl}/things/${thingId}/properties/${propertyId}`;

  const performRequest = async (forceRefresh = false) => {
    const token = await getArduinoAccessToken(forceRefresh);
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  };

  let response = await performRequest();

  if (response.status === 401) {
    response = await performRequest(true);
  }

  if (!response.ok) {
    throw new Error(`Arduino Cloud request failed with ${response.status}`);
  }

  const payload = await response.json();
  const value = Number(payload?.last_value);

  if (!Number.isFinite(value)) {
    throw new Error("Invalid property value from Arduino Cloud");
  }

  return value;
}

async function buildEpicNarrative(humidity: number, temperature: number) {
  const prompt = [
    `Lectura actual de HygroSense: ${humidity}% de humedad y ${temperature}°C de temperatura.`,
    "Cuenta como se siente el ambiente en maximo tres frases fluidas mencionando tanto la humedad como la temperatura.",
    "Incluye hasta tres recomendaciones dentro del mismo texto, sin listas ni numeraciones, considerando ambas variables.",
    "Escribe en espanol cercano y natural, como un especialista humano que evita tecnicismos o referencias a sistemas automaticos.",
  ].join(" ");

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Eres la voz humana de HygroSense. Hablas con calma, optimismo y cercania. Nunca menciones que eres inteligencia artificial; solo comparte observaciones y consejos utiles sobre el ambiente interior.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (!("output" in response)) {
    throw new Error("Unexpected streaming response");
  }

  const parts = response.output
    .flatMap((item) => ("content" in item ? item.content : []))
    .map((chunk) => ("text" in chunk ? chunk.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!parts) {
    throw new Error("OpenAI response missing text");
  }

  return parts;
}

export async function GET() {
  try {
    const [humedad, temperatura] = await Promise.all([
      fetchArduinoPropertyValue(humidityPropertyId),
      fetchArduinoPropertyValue(temperaturePropertyId),
    ]);
    const textoEpico = await buildEpicNarrative(humedad, temperatura);

    return NextResponse.json({ humedad, temperatura, textoEpico });
  } catch (error) {
    console.error("HygroSense overview error:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la informacion del ambiente." },
      { status: 500 }
    );
  }
}
