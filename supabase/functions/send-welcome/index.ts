import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (request) => {
  const body = await request.json().catch(() => ({}));

  return new Response(
    JSON.stringify({
      queued: true,
      type: "send_welcome_email",
      payload: body,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
