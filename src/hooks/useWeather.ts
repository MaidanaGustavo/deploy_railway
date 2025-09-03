import { useEffect, useState } from 'react';

type Coords = { lat: number; lng: number };

export type WeatherData = {
  current?: { temperature: number; wind: number };
  daily?: Array<{ date: string; tmin: number; tmax: number; pop?: number | null }>;
};

export function useWeather(coords?: Coords | null) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run(lat: number, lng: number) {
      try {
        setLoading(true);
        setError(null);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (cancelled) return;
        const out: WeatherData = {
          current: j.current_weather
            ? { temperature: j.current_weather.temperature, wind: j.current_weather.windspeed }
            : undefined,
          daily: Array.isArray(j.daily?.time)
            ? j.daily.time.map((d: string, i: number) => ({
                date: d,
                tmin: j.daily.temperature_2m_min?.[i] ?? null,
                tmax: j.daily.temperature_2m_max?.[i] ?? null,
                pop: j.daily.precipitation_probability_max?.[i] ?? null,
              }))
            : [],
        };
        setData(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar clima');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!coords) return;
    run(coords.lat, coords.lng);
    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng]);

  return { data, loading, error };
}

