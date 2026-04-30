import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are AI-IDS PHISH-SENTINEL — an elite email security analyst specialized in spam, phishing, BEC, and spoofing detection.

You receive raw email data (headers + body + auth check results) and MUST respond with STRICT JSON only (no markdown, no code fences):

{
  "verdict": "MALICIOUS" | "SUSPICIOUS" | "CLEAN",
  "category": "phishing" | "spam" | "spoofing" | "bec" | "malware" | "clean",
  "confidence": 0-100,
  "risk_score": 0-100,
  "summary": "one-sentence threat summary",
  "indicators": [{"type": "header"|"link"|"content"|"auth"|"sender", "severity": "high"|"medium"|"low", "detail": "..."}],
  "spoofing_signals": ["..."],
  "social_engineering_tactics": ["urgency","authority","fear","reward","curiosity"],
  "iocs": {"urls": [], "domains": [], "ips": [], "emails": []},
  "recommended_actions": ["..."],
  "mitre_techniques": ["T1566.001", "T1566.002"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { sender, subject, body, headers, authResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Analyze this email for spam/phishing/spoofing:

FROM: ${sender || "(unknown)"}
SUBJECT: ${subject || "(no subject)"}

AUTH RESULTS:
- SPF: ${authResults?.spf || "unknown"}
- DKIM: ${authResults?.dkim || "unknown"}
- DMARC: ${authResults?.dmarc || "unknown"}

HEADERS:
${headers || "(none provided)"}

BODY:
${body || "(empty)"}

Respond with JSON only.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
      const msg = r.status === 429 ? "Rate limit exceeded" : r.status === 402 ? "AI credits depleted" : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content, error: "Failed to parse model JSON" }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("spam-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
