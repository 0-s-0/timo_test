import { NextResponse } from "next/server";
import { addLocation, listLocations } from "@/lib/locations";

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function GET() {
  const records = await listLocations();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { latitude, longitude, accuracy, source, label } = body as Record<
    string,
    unknown
  >;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json(
      { error: "latitude and longitude are required numbers" },
      { status: 400 },
    );
  }

  if (!isValidCoord(latitude, longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const acc =
    accuracy === null || accuracy === undefined
      ? null
      : typeof accuracy === "number" && Number.isFinite(accuracy)
        ? accuracy
        : null;

  const record = await addLocation({
    latitude,
    longitude,
    accuracy: acc,
    source: typeof source === "string" ? source.slice(0, 64) : "unknown",
    label: typeof label === "string" ? label.slice(0, 128) : null,
    userAgent: request.headers.get("user-agent"),
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[locations] saved", record.id, record.latitude, record.longitude);
  }

  return NextResponse.json({ record }, { status: 201 });
}
