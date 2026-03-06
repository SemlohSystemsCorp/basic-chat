import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, enableRecording, maxParticipants } = await request.json();

    const properties: Record<string, unknown> = {
      enable_chat: true,
      enable_screenshare: true,
      enable_knocking: true,
      exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours
    };

    if (enableRecording) {
      properties.enable_recording = "cloud";
    }

    if (maxParticipants) {
      properties.max_participants = maxParticipants;
    }

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({ properties }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Daily.co error:", err);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    const room = await res.json();

    return NextResponse.json({
      name: room.name,
      url: room.url,
      title: title || "Untitled Meeting",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
