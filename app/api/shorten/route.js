import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // TinyURL API (no key required for basic shortening)
    const tinyUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
    
    const resp = await fetch(tinyUrl);
    if (!resp.ok) {
      throw new Error(`TinyURL error: ${resp.statusText}`);
    }

    const shortUrl = await resp.text();
    return NextResponse.json({ shortUrl });
  } catch (err) {
    console.error("Shorten API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
