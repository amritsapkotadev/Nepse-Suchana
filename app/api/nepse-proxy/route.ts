import { NextResponse } from "next/server";
import { apiCache } from "@/lib/cache";

const NEPSE_API_URL = process.env.NEXT_PUBLIC_NEPSE_API_URL || "https://sharepulse.qzz.io/api/nepse/live-data";
const CACHE_KEY = "nepse-data";
const CACHE_TTL = 30; // Cache for 30 seconds

export async function GET() {
  try {
    // Check cache first
    const cached = apiCache.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const res = await fetch(NEPSE_API_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch NEPSE data: ${res.status} ${res.statusText}` }, { status: res.status });
    }
    const data = await res.json();
    
    // Store in cache
    apiCache.set(CACHE_KEY, data, CACHE_TTL);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch NEPSE data." }, { status: 500 });
  }
}
