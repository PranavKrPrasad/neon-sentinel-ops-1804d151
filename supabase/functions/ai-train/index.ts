import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_SYSTEM = `You are AI-IDS PHISH-CLASSIFIER. Classify the email into exactly one label and return ONLY JSON:
{"label":"phishing"|"spam"|"bec"|"spoofing"|"malware"|"clean","confidence":0-100,"reasoning":"<one short sentence>"}
No markdown, no code fences.`;

const ATTACK_SYSTEM = `You are AI-IDS ATTACK-CLASSIFIER. Classify the network log line into exactly one label and return ONLY JSON:
{"label":"ddos"|"sqli"|"phishing"|"ransomware"|"bruteforce"|"c2"|"benign","confidence":0-100,"reasoning":"<one short sentence>"}
No markdown, no code fences.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind, sample, expected } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = kind === "email" ? EMAIL_SYSTEM : ATTACK_SYSTEM;
    const userPrompt = kind === "email"
      ? `From: ${sample.sender}\nSubject: ${sample.subject}\nBody: ${sample.body}\nSPF: ${sample.spf} DKIM: ${sample.dkim} DMARC: ${sample.dmarc}`
      : `LOG: ${sample.log}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
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
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { label: "unknown", confidence: 0, reasoning: "parse error" }; }
    parsed.expected = expected ?? null;
    parsed.correct = expected ? parsed.label === expected : null;
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-train error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
