import { NextResponse } from "next/server";

const NEPSE_API_URL = process.env.NEXT_PUBLIC_NEPSE_API_URL || "https://sharepulse.qzz.io/api/nepse/live-data";

export async function GET() {
  try {
    const res = await fetch(NEPSE_API_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch NEPSE data: ${res.status} ${res.statusText}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch NEPSE data." }, { status: 500 });
  }
}
