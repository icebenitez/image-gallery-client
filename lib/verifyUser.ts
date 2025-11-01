import { NextRequest} from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return null;

  return { user: data.user, token };
}
