"use client";

import { useCallback, useState } from "react";
import type { LocationRecord } from "@/lib/locations";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function mapsUrl(lat: number, lng: number) {
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=访客位置`;
}

async function fetchRecords(signal?: AbortSignal): Promise<LocationRecord[]> {
  const res = await fetch("/api/locations", {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error("加载失败");
  const data = (await res.json()) as { records: LocationRecord[] };
  return data.records ?? [];
}

type Props = {
  initialRecords: LocationRecord[];
};

export function LocationMapList({ initialRecords }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const next = await fetchRecords(controller.signal);
      setRecords(next);
    } catch {
      setError("无法加载位置数据，请确认与电脑在同一 WiFi 且 dev 服务已启动");
    } finally {
      window.clearTimeout(timeout);
      setRefreshing(false);
    }
  }, []);

  if (error && records.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-300">{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-rose-600/80 px-4 py-2 text-sm text-white"
        >
          重试
        </button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm leading-relaxed text-neutral-400">
          暂无记录。请用手机打开首页，点击底部
          <span className="text-rose-200/90">「轻触此处记录位置」</span>
          ，并在浏览器中允许定位。
        </p>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="w-full rounded-lg border border-white/15 py-2 text-sm text-rose-200 disabled:opacity-50"
        >
          {refreshing ? "刷新中…" : "刷新"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">共 {records.length} 条</p>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="text-sm text-rose-300 hover:text-rose-200 disabled:opacity-50"
        >
          {refreshing ? "刷新中…" : "刷新"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-amber-400/90">{error}（仍显示上次数据）</p>
      )}
      <ul className="space-y-3">
        {records.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-rose-100">
                  {r.label ?? "访客"}
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {r.source}
                  </span>
                </p>
                <p className="mt-1 font-mono text-sm text-neutral-300">
                  {r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}
                </p>
                {r.accuracy != null && (
                  <p className="mt-1 text-xs text-neutral-500">
                    精度约 ±{Math.round(r.accuracy)} 米
                  </p>
                )}
                <p className="mt-2 text-xs text-neutral-500">
                  {formatTime(r.recordedAt)}
                </p>
              </div>
              <a
                href={mapsUrl(r.latitude, r.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-rose-600/90 px-3 py-1.5 text-xs text-white"
              >
                地图打开
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
