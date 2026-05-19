import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const comparisons = await prisma.comparison.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50
    });
    return NextResponse.json(comparisons);
  } catch (err) {
    console.error("Error fetching history from Postgres:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
