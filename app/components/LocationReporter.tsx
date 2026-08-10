"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "love-location-reported";

type Props = {
  label?: string;
  source?: string;
};

export function LocationReporter({ label, source = "home" }: Props) {
  const [hidden, setHidden] = useState(true);
  const [pending, setPending] = useState(false);
  const inflight = useRef(false);

  const submit = useCallback(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setHidden(true);
      return;
    }
    if (!("geolocation" in navigator)) return;
    if (inflight.current) return;

    inflight.current = true;
    setPending(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source,
              label: label ?? null,
            }),
            keepalive: true,
          });
          if (res.ok) {
            sessionStorage.setItem(SESSION_KEY, "1");
            setHidden(true);
          }
        } catch {
          /* network error — allow retry */
        } finally {
          inflight.current = false;
          setPending(false);
        }
      },
      () => {
        inflight.current = false;
        setPending(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20_000,
      },
    );
  }, [label, source]);

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setHidden(true);
      return;
    }
    setHidden(false);

    const onGesture = () => submitRef.current();

    document.addEventListener("touchstart", onGesture, {
      once: true,
      passive: true,
    });
    document.addEventListener("click", onGesture, { once: true });

    const desktopTimer = window.setTimeout(() => submitRef.current(), 800);

    return () => {
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("click", onGesture);
      window.clearTimeout(desktopTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={() => submitRef.current()}
      disabled={pending}
      className="fixed bottom-6 left-1/2 z-30 max-w-[90vw] -translate-x-1/2 rounded-full border border-white/25 bg-black/50 px-4 py-2.5 text-xs text-rose-50 shadow-lg backdrop-blur-md active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "正在获取位置…" : "轻触此处记录位置（仅保存到服务器）"}
    </button>
  );
}
