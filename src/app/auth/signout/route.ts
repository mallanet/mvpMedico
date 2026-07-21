import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/mock/mode";
import { clearDemoSession } from "@/lib/mock/session";

export async function POST(request: Request) {
  if (isDemoMode()) {
    await clearDemoSession();
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
