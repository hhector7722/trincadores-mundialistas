import { NextResponse } from "next/server";
import { syncKnockoutBracket } from "@/lib/predictions/sync-knockout";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await syncKnockoutBracket();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing knockout bracket:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
