import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.message || !body.sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, forward to error tracking service (Sentry, LogRocket, etc.)
    console.error("[analytics:error]", {
      message: body.message,
      stack: body.stack,
      context: body.context,
      severity: body.severity || "error",
      sessionId: body.sessionId,
      userId: body.userId,
      timestamp: body.timestamp,
    });

    // TODO: Forward to actual error tracking provider
    // await fetch("https://sentry.io/api/...", { ... });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}