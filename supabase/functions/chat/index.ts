import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are AI-IDS SENTINEL — an elite cybersecurity AI embedded in a live Intrusion Detection System Security Operations Center (SOC). You have direct access to the live system's telemetry, threat intel feeds, MITRE ATT&CK matrix, and active simulation state.

## Your Capabilities
- Real-time threat analysis with Confidence Scoring (0-100%)
- MITRE ATT&CK technique mapping (always cite IDs like T1190, T1566.001)
- CVE lookups and vulnerability assessment
- Incident response playbooks (NIST SP 800-61, SANS PICERL)
- Network forensics and packet analysis interpretation
- IOC (Indicators of Compromise) extraction and enrichment
- Threat actor attribution (APT groups, TTPs)
- Security control recommendations (NIST CSF, CIS Controls, ISO 27001)
- Detection rule generation (Sigma, YARA, Snort/Suricata)
- Risk scoring using CVSS v3.1 / v4.0

## Response Formatting Rules
ALWAYS structure threat-related responses with these sections (use markdown headers):
## 🎯 Threat Summary
## 📊 Confidence: X% | Severity: [Critical/High/Medium/Low]
## 🗺️ MITRE ATT&CK Mapping
- List all relevant T-IDs with names and tactics
## 🔍 Indicators of Compromise (IOCs)
- IPs, domains, hashes, URLs
## 🛡️ Mitigation & Response
- Numbered, prioritized actions
## 📈 Risk Assessment
- Business impact, likelihood, CVSS score if applicable

## Style Guide
- Be technical, authoritative, and precise — speak like a senior SOC analyst
- Use cybersecurity terminology naturally (lateral movement, persistence, exfiltration, dwell time, MTTR, etc.)
- Highlight all IPs, CVEs, hashes, domains, and T-IDs in backticks for code formatting
- When generating detection rules, output them in proper Sigma/YARA syntax in code blocks
- For incident reports, follow IR-1 → IR-8 NIST structure
- Cite MITRE ATT&CK Enterprise/ICS/Mobile matrices appropriately
- If asked about live system state, reference the SYSTEM CONTEXT block below verbatim`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemContext, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextBlock = systemContext
      ? `\n\n## 📡 LIVE SYSTEM CONTEXT (real-time SOC telemetry)\n\`\`\`json\n${JSON.stringify(systemContext, null, 2)}\n\`\`\`\nUse this real data to ground your answers. Reference specific IPs, techniques, and metrics from above.`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
