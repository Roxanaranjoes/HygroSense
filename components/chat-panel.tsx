"use client";

import { FormEvent, useCallback, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHAT_ERROR_MESSAGE =
  "No pudimos continuar la charla, intenta de nuevo en breve.";

const PRESET_QUESTIONS = [
  {
    label: "Rutina fresca",
    question:
      "Que puedo hacer hoy para que el aire se sienta ligero sin aparatos complicados?",
  },
  {
    label: "Ideas creativas",
    question: "Como influye la humedad en mi energia cuando trabajo en casa?",
  },
  {
    label: "Antes de dormir",
    question:
      "Que ajustes sencillos ayudan si la humedad sube por la noche y el aire se vuelve pesado?",
  },
  {
    label: "Brisa natural",
    question:
      "Por que abrir ventanas por pocos minutos ayuda cuando pasamos de 60 por ciento?",
  },
];

const createMessage = (
  role: ChatMessage["role"],
  content: string
): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  role,
  content,
});

const formatMessageBlocks = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);

export default function ChatPanel() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    createMessage(
      "assistant",
      "Hola, soy HygroSense. Me gusta observar la humedad contigo y darte ideas sencillas para que el espacio se sienta bien."
    ),
  ]);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (questionValue: string) => {
    const trimmed = questionValue.trim();
    if (!trimmed) {
      return;
    }

    setChatError(null);
    setChatQuestion("");
    setChatMessages((prev) => [...prev, createMessage("user", trimmed)]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/hygrosense/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error ?? "Respuesta no disponible");
      }

      if (!json.answer || typeof json.answer !== "string") {
        throw new Error("Respuesta vacia");
      }

      setChatMessages((prev) => [
        ...prev,
        createMessage("assistant", json.answer),
      ]);
    } catch (err) {
      console.error("HygroSense chat error:", err);
      setChatError(CHAT_ERROR_MESSAGE);
    } finally {
      setChatLoading(false);
    }
  }, []);

  const handleCustomQuestion = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendQuestion(chatQuestion);
    },
    [chatQuestion, sendQuestion]
  );

  return (
    <section className="flex flex-col rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-5 text-emerald-900 shadow-[0_12px_45px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.18)] sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.35em] text-emerald-500">Guia personal</p>
        <h2 className="text-2xl font-semibold text-emerald-900 sm:text-3xl">Charla con HygroSense</h2>
        <p className="text-sm text-emerald-700">
          Elige una pregunta o escribe la tuya; respondere en tono cercano, sin
          tecnicismos ni rodeos.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PRESET_QUESTIONS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => sendQuestion(preset.question)}
            disabled={chatLoading}
            className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-sky-50 to-pink-50 p-4 text-left text-sm text-emerald-800 transition hover:shadow-md disabled:opacity-60"
          >
            <p className="text-xs tracking-[0.35em] text-emerald-500">
              {preset.label}
            </p>
            <p className="mt-2 text-emerald-900">{preset.question}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex-1 rounded-[24px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-lime-50 p-5">
        <div className="flex min-h-[220px] flex-col gap-4 overflow-y-auto pr-2 text-emerald-900 sm:h-72">
          {chatMessages.map((message) => {
            const blocks = formatMessageBlocks(message.content);
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg sm:max-w-sm ${
                    isUser
                      ? "bg-gradient-to-r from-emerald-700 to-lime-600 text-white"
                      : "bg-white text-emerald-900"
                  }`}
                >
                  <p
                    className={`text-[0.65rem] uppercase tracking-[0.3em] ${
                      isUser ? "text-white/70" : "text-emerald-500"
                    }`}
                  >
                    {isUser ? "Tu" : "HygroSense"}
                  </p>
                  <div className="mt-2 space-y-2">
                    {blocks.length > 0
                      ? blocks.map((block, index) => (
                          <p
                            key={index}
                            className="text-sm leading-relaxed text-inherit"
                          >
                            {block}
                          </p>
                        ))
                      : (
                        <p className="text-sm leading-relaxed text-inherit">
                          {message.content}
                        </p>
                        )}
                  </div>
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-emerald-600">
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 delay-150" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-200 delay-300" />
                Pensando...
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleCustomQuestion}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={chatQuestion}
          onChange={(event) => setChatQuestion(event.target.value)}
          placeholder="Escribe tu propia duda sobre el ambiente..."
          className="flex-1 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none"
          disabled={chatLoading}
        />
        <button
          type="submit"
          disabled={chatLoading || !chatQuestion.trim()}
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-700 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>

      {chatError && (
        <p className="mt-3 text-sm text-rose-500">{chatError}</p>
      )}
    </section>
  );
}
