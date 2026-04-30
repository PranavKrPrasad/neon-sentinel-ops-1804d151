export interface EmailSample {
  id: string;
  sender: string;
  displayName: string;
  subject: string;
  body: string;
  headers: string;
  spf: "pass" | "fail" | "softfail" | "neutral";
  dkim: "pass" | "fail" | "none";
  dmarc: "pass" | "fail" | "none";
  verdict: "MALICIOUS" | "SUSPICIOUS" | "CLEAN";
  category: "phishing" | "spam" | "spoofing" | "bec" | "malware" | "clean";
  receivedAt: string;
}

export const emailSamples: EmailSample[] = [
  {
    id: "EM-001",
    sender: "security-alert@paypaI-secure.com",
    displayName: "PayPal Security",
    subject: "⚠️ Urgent: Your account will be suspended in 24 hours",
    body: "Dear Customer, We detected unusual activity on your account. Click here immediately to verify: http://paypaI-secure.com/verify?id=8821 — Failure to act will result in permanent suspension.",
    headers: "Received: from unknown.host (185.220.101.34)\nReply-To: collector@evil-mail.ru\nReturn-Path: <bounce@suspicious.tk>",
    spf: "fail", dkim: "fail", dmarc: "fail",
    verdict: "MALICIOUS", category: "phishing", receivedAt: "2 min ago",
  },
  {
    id: "EM-002",
    sender: "ceo@compamy-corp.com",
    displayName: "John Smith (CEO)",
    subject: "Quick favor — need wire transfer urgently",
    body: "Hi, I'm in a meeting and need you to wire $48,500 to a vendor immediately. Send me the confirmation. Don't call, just email back. — John (sent from my iPhone)",
    headers: "Received: from gmail-relay.bec-actor.net (45.155.205.233)\nX-Originating-IP: 45.155.205.233\nReply-To: ceo.john.urgent@gmail.com",
    spf: "softfail", dkim: "none", dmarc: "fail",
    verdict: "MALICIOUS", category: "bec", receivedAt: "8 min ago",
  },
  {
    id: "EM-003",
    sender: "noreply@dropbox-share.info",
    displayName: "Dropbox",
    subject: "📎 You received a shared document: Q4_Financials.pdf",
    body: "Someone shared a document with you. Open: https://dropbox-share.info/dl/q4-fin.html.exe — Expires in 48 hours.",
    headers: "Received: from share-relay.info (91.215.85.194)\nContent-Type: multipart/mixed",
    spf: "fail", dkim: "fail", dmarc: "fail",
    verdict: "MALICIOUS", category: "malware", receivedAt: "15 min ago",
  },
  {
    id: "EM-004",
    sender: "winner@mega-lottery-intl.tk",
    displayName: "International Lottery",
    subject: "🎉 Congratulations! You won $2,500,000 USD",
    body: "You have been selected as the winner of our annual draw. To claim, send your full name, address, and a $250 processing fee to claims@mega-lottery-intl.tk",
    headers: "Received: from bulk-mailer.tk (103.224.182.250)",
    spf: "fail", dkim: "none", dmarc: "fail",
    verdict: "MALICIOUS", category: "spam", receivedAt: "32 min ago",
  },
  {
    id: "EM-005",
    sender: "support@github.com",
    displayName: "GitHub",
    subject: "[GitHub] A new SSH key was added to your account",
    body: "If you didn't add this key, you can remove it and reset your password at https://github.com/settings/keys",
    headers: "Received: from out-25.smtp.github.com (192.30.252.196)\nDKIM-Signature: v=1; a=rsa-sha256; d=github.com",
    spf: "pass", dkim: "pass", dmarc: "pass",
    verdict: "CLEAN", category: "clean", receivedAt: "1 hr ago",
  },
  {
    id: "EM-006",
    sender: "hr@yourc0mpany.com",
    displayName: "HR Department",
    subject: "Updated payroll policy — please review",
    body: "Please review the attached payroll update and confirm via the portal: http://yourc0mpany-hr.com/login",
    headers: "Received: from mail.spoof-actor.net (23.129.64.214)\nReply-To: hr.dept@protonmail.com",
    spf: "softfail", dkim: "none", dmarc: "fail",
    verdict: "SUSPICIOUS", category: "spoofing", receivedAt: "2 hr ago",
  },
  {
    id: "EM-007",
    sender: "billing@aws.amazon.com",
    displayName: "AWS Billing",
    subject: "Your AWS Invoice for February 2026",
    body: "Your monthly invoice is now available in the AWS console.",
    headers: "Received: from amazonses.com\nDKIM-Signature: v=1; d=amazon.com\nSPF: pass",
    spf: "pass", dkim: "pass", dmarc: "pass",
    verdict: "CLEAN", category: "clean", receivedAt: "3 hr ago",
  },
  {
    id: "EM-008",
    sender: "it-helpdesk@microsft-365.com",
    displayName: "IT Helpdesk",
    subject: "Mandatory MFA reset — action required today",
    body: "Your Microsoft 365 MFA must be reset today. Login here to complete: https://microsft-365.com/mfa-reset",
    headers: "Received: from helpdesk-relay.actor.cn (185.220.101.34)",
    spf: "fail", dkim: "fail", dmarc: "fail",
    verdict: "MALICIOUS", category: "phishing", receivedAt: "4 hr ago",
  },
];

// Heuristic scoring for instant local analysis (no AI call)
export interface HeuristicResult {
  score: number;
  signals: { label: string; severity: "high" | "medium" | "low"; reason: string }[];
}

const SUSPICIOUS_TLDS = [".tk", ".ru", ".cn", ".info", ".xyz", ".top", ".click"];
const URGENCY_WORDS = ["urgent", "immediately", "24 hours", "suspend", "verify now", "act now", "expires", "mandatory"];
const REWARD_WORDS = ["winner", "won", "prize", "lottery", "congratulations", "claim", "free"];
const HOMOGLYPHS = /[аеорсух]/i; // Cyrillic look-alikes
const LOOKALIKE_BRANDS = [/paypa[il1]/i, /micr[o0]s[o0]ft/i, /amaz[o0]n/i, /g[o0]{2}gle/i, /faceb[o0]{2}k/i, /netfl[il1]x/i];

export function analyzeHeuristics(email: { sender: string; subject: string; body: string; spf: string; dkim: string; dmarc: string; headers: string }): HeuristicResult {
  const signals: HeuristicResult["signals"] = [];
  let score = 0;

  if (email.spf === "fail") { signals.push({ label: "SPF Fail", severity: "high", reason: "Sender IP not authorized for domain" }); score += 25; }
  else if (email.spf === "softfail") { signals.push({ label: "SPF Softfail", severity: "medium", reason: "Domain weakly rejects sender IP" }); score += 12; }

  if (email.dkim === "fail") { signals.push({ label: "DKIM Fail", severity: "high", reason: "Cryptographic signature invalid" }); score += 25; }
  else if (email.dkim === "none") { signals.push({ label: "No DKIM", severity: "medium", reason: "Email not cryptographically signed" }); score += 8; }

  if (email.dmarc === "fail") { signals.push({ label: "DMARC Fail", severity: "high", reason: "Domain policy violation" }); score += 20; }

  for (const re of LOOKALIKE_BRANDS) {
    if (re.test(email.sender)) { signals.push({ label: "Brand Look-alike", severity: "high", reason: `Sender domain mimics a known brand (${email.sender.split("@")[1]})` }); score += 20; break; }
  }

  if (HOMOGLYPHS.test(email.sender)) { signals.push({ label: "Homoglyph Attack", severity: "high", reason: "Cyrillic characters disguised as Latin" }); score += 18; }

  for (const tld of SUSPICIOUS_TLDS) {
    if (email.sender.endsWith(tld)) { signals.push({ label: "Suspicious TLD", severity: "medium", reason: `Sender uses ${tld} TLD often abused for spam` }); score += 10; break; }
  }

  const text = `${email.subject} ${email.body}`.toLowerCase();
  const urgencyHits = URGENCY_WORDS.filter(w => text.includes(w));
  if (urgencyHits.length >= 2) { signals.push({ label: "Urgency Pressure", severity: "medium", reason: `Uses urgency tactics: ${urgencyHits.slice(0, 3).join(", ")}` }); score += 12; }

  const rewardHits = REWARD_WORDS.filter(w => text.includes(w));
  if (rewardHits.length >= 2) { signals.push({ label: "Reward Bait", severity: "medium", reason: `Reward/prize lures: ${rewardHits.slice(0, 3).join(", ")}` }); score += 10; }

  if (/\.exe|\.scr|\.html\.exe|\.zip|\.rar/i.test(email.body)) { signals.push({ label: "Malicious Attachment", severity: "high", reason: "Body references executable file types" }); score += 22; }

  if (/reply-to:.*(?:protonmail|gmail|yandex|mail\.ru)/i.test(email.headers) && !/(?:gmail|protonmail)/i.test(email.sender)) {
    signals.push({ label: "Mismatched Reply-To", severity: "high", reason: "Reply-To uses a free webmail different from sender domain" });
    score += 18;
  }

  const ipMatch = email.headers.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (ipMatch && /^(185\.220|45\.155|91\.215|103\.224|23\.129)/.test(ipMatch[1])) {
    signals.push({ label: "Known Malicious IP", severity: "high", reason: `Origin IP ${ipMatch[1]} on threat intel blocklist` });
    score += 25;
  }

  return { score: Math.min(100, score), signals };
}
