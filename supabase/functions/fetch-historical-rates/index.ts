import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base, target, days } = await req.json();

    if (!base || !target || !days) {
      return new Response(
        JSON.stringify({ error: "Missing base, target, or days parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.min(days, 365));

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    // Frankfurter API is free and doesn't require an API key
    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=${base}&to=${target}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Frankfurter API error [${response.status}]: ${body}`);
    }

    const data = await response.json();

    // Transform to array of { date, rate } sorted by date
    const points: { date: string; rate: number }[] = [];
    if (data.rates) {
      for (const [date, rateObj] of Object.entries(data.rates)) {
        const rateVal = (rateObj as Record<string, number>)[target];
        if (rateVal !== undefined) {
          points.push({ date, rate: rateVal });
        }
      }
    }
    points.sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({
        base,
        target,
        points,
        fetchedAt: Date.now(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching historical rates:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
