"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "love-location-reported";

type Props = {
  label?: string;
  source?: string;
};

export function LocationReporter({ label, source = "home" }: Props) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      return;
    }

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
          });
          if (res.ok) {
            sessionStorage.setItem(SESSION_KEY, "1");
          }
        } catch {
          /* ignore network errors */
        }
      },
      () => {
        /* user denied or unavailable */
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 12_000,
      },
    );
  }, [label, source]);

  return null;
}
