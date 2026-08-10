import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type LocationRecord = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: string;
  source: string;
  label: string | null;
  userAgent: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "locations.json");

async function ensureStore(): Promise<LocationRecord[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as LocationRecord[];
  } catch {
    return [];
  }
}

async function persist(records: LocationRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function listLocations(): Promise<LocationRecord[]> {
  const records = await ensureStore();
  return records.sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
}

export type CreateLocationInput = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  source?: string;
  label?: string | null;
  userAgent?: string | null;
};

export async function addLocation(
  input: CreateLocationInput,
): Promise<LocationRecord> {
  const records = await ensureStore();
  const record: LocationRecord = {
    id: randomUUID(),
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy ?? null,
    recordedAt: new Date().toISOString(),
    source: input.source ?? "unknown",
    label: input.label ?? null,
    userAgent: input.userAgent ?? null,
  };
  records.push(record);
  await persist(records);
  return record;
}
