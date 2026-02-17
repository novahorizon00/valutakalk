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
    const apiKey = Deno.env.get("EXCHANGE_RATE_API_KEY");

    let url: string;
    if (apiKey) {
      // Use ExchangeRate-API with key
      url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`;
    } else {
      // Free fallback: open.er-api.com (no key needed, EUR base)
      url = "https://open.er-api.com/v6/latest/EUR";
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();

    // Normalize response
    const rates = data.rates || data.conversion_rates;
    if (!rates || typeof rates !== "object") {
      throw new Error("Invalid API response format");
    }

    return new Response(
      JSON.stringify({
        base: "EUR",
        rates,
        timestamp: Date.now(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
