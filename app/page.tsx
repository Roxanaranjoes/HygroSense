"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface HygroSenseResponse {
  humedad: number;
  textoEpico: string;
  error?: string;
}

const FRIENDLY_ERROR_MESSAGE =
  "No pudimos traer la lectura, intenta otra vez.";
const REFRESH_INTERVAL_MS = 10_000;

const ChatPanel = dynamic(() => import("@/components/chat-panel"), {
  ssr: false,
  loading: () => (
    <section className="flex flex-col gap-5 rounded-3xl bg-white/60 p-6 shadow-inner shadow-slate-200">
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
        <div className="h-8 w-3/4 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="flex-1 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-16 w-full animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-12 flex-1 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-12 w-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </section>
  ),
});

export default function HomePage() {
  const [data, setData] = useState<HygroSenseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/hygrosense/overview", {
        cache: "no-store",
      });

      const json: HygroSenseResponse = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error ?? "Lectura fallida");
      }

      if (typeof json.humedad !== "number" || Number.isNaN(json.humedad)) {
        throw new Error("Humedad invalida");
      }

      setData({
        humedad: json.humedad,
        textoEpico: json.textoEpico,
      });
    } catch (err) {
      console.error("HygroSense overview error:", err);
      setError(FRIENDLY_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const humidityValue = data?.humedad ?? null;
  const humidityDisplay =
    humidityValue === null ? "--" : `${Math.round(humidityValue)}%`;
  const humidityProgress =
    humidityValue === null
      ? 0
      : Math.min(100, Math.max(0, Math.round(humidityValue)));

  const environmentReading = useMemo(() => {
    if (humidityValue === null) {
      return {
        label: "Esperando lectura",
        description:
          "En segundos veras la primera referencia para este espacio.",
        gradient: "from-emerald-200 via-emerald-300 to-emerald-400",
        tagline: "Preparando la primera medicion confiable.",
      };
    }

    if (humidityValue < 40) {
      return {
        label: "Ambiente seco",
        description:
          "El aire anda ligero: ventila sin problema, pero cuida piel y plantas.",
        gradient: "from-amber-300 via-orange-400 to-rose-400",
        tagline: "Suma humedad con plantas o recipientes de agua.",
      };
    }

    if (humidityValue <= 60) {
      return {
        label: "Ambiente equilibrado",
        description: "Todo esta en un punto comodo para descansar y trabajar.",
        gradient: "from-emerald-300 via-teal-400 to-sky-400",
        tagline: "Ventila suave para conservar este punto dulce.",
      };
    }

    return {
      label: "Ambiente humedo",
      description:
        "El aire se siente denso y puede dejar telas pesadas o paredes frias.",
      gradient: "from-sky-400 via-blue-500 to-indigo-500",
      tagline: "Busca corrientes cortas o apoyo de un deshumidificador.",
    };
  }, [humidityValue]);

  const epicParagraphs = useMemo(() => {
    if (!data?.textoEpico) {
      return [];
    }

    return data.textoEpico
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [data?.textoEpico]);

  const highlightStats = useMemo(
    () => [
      {
        label: "Lectura actual",
        value: humidityDisplay,
        detail: environmentReading.tagline,
      },
      {
        label: "Zona sugerida",
        value: "45% - 55%",
        detail: "Rango amable para dia a dia.",
      },
      {
        label: "Frecuencia",
        value: "Cada 10 s",
        detail: "HygroSense vigila el ambiente por ti.",
      },
    ],
    [environmentReading.tagline, humidityDisplay]
  );

  const essentials = useMemo(
    () => [
      {
        title: "Sensacion general",
        description: environmentReading.label,
      },
      {
        title: "Idea rapida",
        description: environmentReading.tagline,
      },
      {
        title: "Seguimiento",
        description: "Lecturas constantes para decidir con calma.",
      },
      {
        title: "Consejos",
        description: "HygroSense comparte tips cortos en cada relato.",
      },
    ],
    [environmentReading.label, environmentReading.tagline]
  );

  const showInitialLoading = !data && loading;

  const scrollToChat = useCallback(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffbf5,_#defbea_40%,_#daf1ff_70%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="hidden lg:block">
          <div className="absolute inset-x-0 top-0 mx-auto h-72 w-72 rounded-full bg-pink-200 blur-[150px] mix-blend-screen" />
          <div className="absolute left-6 top-1/3 h-80 w-80 rounded-full bg-emerald-200 blur-[200px] mix-blend-screen" />
          <div className="absolute right-12 top-1/2 h-80 w-80 rounded-full bg-sky-200 blur-[220px] mix-blend-screen" />
          <div className="absolute left-1/4 bottom-0 h-64 w-64 rounded-full bg-amber-200 blur-[190px] mix-blend-screen" />
        </div>
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-[90rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-16">
        <section className="rounded-[28px] bg-white/95 p-5 shadow-[0_20px_60px_rgba(18,28,45,0.12)] backdrop-blur md:p-6">
          <header className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch lg:gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-pink-100 bg-gradient-to-br from-white to-pink-50 text-xl font-semibold text-pink-600 shadow-inner sm:h-16 sm:w-16 sm:text-2xl">
                  HS
                </div>
                <div>
                  <p className="text-[0.65rem] tracking-[0.35em] text-pink-500 sm:text-xs">
                    HygroSense
                  </p>
                  <h1 className="text-3xl font-semibold text-emerald-900 sm:text-4xl">
                    Ritmo del ambiente
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-base text-emerald-800 sm:text-lg">
                HygroSense traduce la humedad en palabras simples y señales cercanas.
                Sin tecnicismos, solo lo que necesitas para cuidar tu hogar.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700 sm:text-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm shadow-emerald-200/70">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
                  </span>
                  Lectura en vivo
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm shadow-amber-200/70">
                  <span className="text-xs font-semibold text-amber-500">10s</span>
                  Actualizacion constante
                </div>
              </div>
              <div className="grid gap-4 text-sm text-emerald-800 sm:grid-cols-2 lg:grid-cols-3">
                {highlightStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-200/70"
                  >
                    <p className="text-[0.7rem] tracking-[0.4em] text-pink-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-emerald-600">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 text-emerald-900 shadow-lg shadow-emerald-100/70 lg:flex lg:flex-col lg:justify-between">
              <div>
                <p className="text-xs tracking-[0.4em] text-emerald-500">Panorama</p>
                <p className="mt-2 text-4xl font-semibold">{humidityDisplay}</p>
                <p className="mt-1 text-sm text-emerald-600">{environmentReading.label}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-emerald-500">
                  <span>Lecturas activas</span>
                  <span>10 s</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-emerald-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${humidityProgress}%` }} />
                </div>
                <p className="text-xs text-emerald-700">{environmentReading.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-2">
              <button
                onClick={fetchOverview}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:hover:translate-y-0 sm:px-6"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Actualizar lectura
              </button>
              <button
                type="button"
                onClick={scrollToChat}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-pink-200 bg-white/80 px-5 py-3 text-sm font-semibold text-pink-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-50 hover:text-pink-600 sm:px-6"
              >
                <span className="h-2 w-2 rounded-full bg-pink-400" />
                Ir a la charla IA
              </button>
            </div>
          </header>

          {showInitialLoading && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Preparando la primera lectura...
            </p>
          )}

          {error && (
            <p className="mt-6 text-center text-sm text-rose-500" aria-live="polite">
              {error}
            </p>
          )}

          <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr] 2xl:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-8 rounded-[28px] border border-emerald-100 bg-white/85 p-5 shadow-inner shadow-emerald-100 sm:p-6">
              <div className="flex flex-col gap-8 lg:flex-row">
                <div className="flex flex-1 flex-col items-center gap-6">
                  <div className="relative transition-transform duration-500 hover:scale-105">
                    <div className="absolute inset-4 rounded-full bg-gradient-to-r from-emerald-50 to-lime-100 blur-2xl" />
                    <div className="relative h-40 w-40 rounded-full border border-emerald-100 bg-white p-1 sm:h-48 sm:w-48">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-emerald-50 bg-gradient-to-b from-white to-emerald-50/40 text-center">
                        <span className="text-xs tracking-[0.3em] text-emerald-500">
                          Humedad
                        </span>
                        <p className="mt-2 text-5xl font-semibold text-emerald-900">
                          {humidityDisplay}
                        </p>
                        <span className="mt-2 text-xs text-emerald-500">
                          Lectura en tiempo real
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full bg-gradient-to-r ${environmentReading.gradient} px-6 py-1 text-xs font-semibold tracking-wide text-white`}
                  >
                    {environmentReading.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs tracking-[0.3em] text-emerald-500">
                      <span>Intensidad</span>
                      <span>{humidityDisplay}</span>
                    </div>
                    <div
                      className="h-3 w-full rounded-full border border-emerald-100 bg-emerald-50"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${environmentReading.gradient}`}
                        style={{ width: `${humidityProgress}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-emerald-800">
                    {environmentReading.description}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-lime-50 to-white px-4 py-3">
                      <p className="text-xs tracking-[0.4em] text-sky-500">
                        Sensacion
                      </p>
                      <p className="mt-1 text-xl font-semibold text-emerald-900">
                        {environmentReading.label}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        {environmentReading.tagline}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-white px-4 py-3">
                      <p className="text-xs tracking-[0.4em] text-cyan-500">
                        Proximo paso
                      </p>
                      <p className="mt-1 text-xl font-semibold text-emerald-900">
                        Ajusta el ambiente
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        Usa la guia para decidir si ventilar, humidificar o solo
                        descansar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-sm tracking-[0.3em] text-emerald-500">
                    Relato del ambiente
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-emerald-900">
                    Lo que esta pasando ahora mismo.
                  </h2>
                  <div className="mt-4 rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-5">
                    {epicParagraphs.length > 0 ? (
                      <div className="space-y-3 text-base leading-relaxed text-emerald-900">
                        {epicParagraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-700">
                        Apenas llegue la primera historia veras una descripcion
                        clara y consejos faciles de aplicar.
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {essentials.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-rose-50 to-amber-50 px-4 py-4 text-sm text-emerald-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/80"
                    >
                      <p className="text-base font-semibold text-emerald-900">
                        {card.title}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div ref={chatRef} className="h-full">
              <ChatPanel />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
