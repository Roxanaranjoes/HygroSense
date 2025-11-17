import { NextResponse } from "next/server";
import openai from "@/lib/openai";

function extractText(response: Awaited<ReturnType<typeof openai.responses.create>>) {
  if (!("output" in response)) {
    throw new Error("Unexpected streaming response");
  }

  const chunks = response.output
    .flatMap((item) => ("content" in item ? item.content : []))
    .map((chunk) => ("text" in chunk ? chunk.text : ""))
    .filter(Boolean);

  return chunks.join("\n").trim();
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Pregunta no valida." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Eres la guia personal de HygroSense. Respondes en espanol sencillo, tono humano y sereno. No menciones que eres un modelo o IA; ofrece consejos cotidianos sobre humedad y bienestar.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = extractText(response);

    if (!answer) {
      throw new Error("Respuesta vacia");
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("HygroSense chat error:", error);
    return NextResponse.json(
      { error: "No se pudo responder la consulta en este momento." },
      { status: 500 }
    );
  }
}
