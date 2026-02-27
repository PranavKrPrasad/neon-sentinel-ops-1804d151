// Threat indicators
export interface ThreatIndicator {
  id: string;
  type: "IP" | "Domain" | "Hash" | "URL";
  value: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  firstSeen: string;
  lastSeen: string;
  status: "active" | "resolved" | "investigating";
}

export const threatIndicators: ThreatIndicator[] = [
  { id: "TI-001", type: "IP", value: "185.220.101.34", severity: "critical", source: "AbuseIPDB", firstSeen: "2026-02-20", lastSeen: "2026-02-27", status: "active" },
  { id: "TI-002", type: "IP", value: "45.155.205.233", severity: "high", source: "AlienVault OTX", firstSeen: "2026-02-18", lastSeen: "2026-02-26", status: "active" },
  { id: "TI-003", type: "Domain", value: "malware-c2.evil.net", severity: "critical", source: "VirusTotal", firstSeen: "2026-02-15", lastSeen: "2026-02-27", status: "active" },
  { id: "TI-004", type: "Hash", value: "e99a18c428cb38d5f260853678922e03", severity: "high", source: "MalwareBazaar", firstSeen: "2026-02-22", lastSeen: "2026-02-25", status: "investigating" },
  { id: "TI-005", type: "URL", value: "http://phish-login.example.com/auth", severity: "medium", source: "PhishTank", firstSeen: "2026-02-24", lastSeen: "2026-02-27", status: "active" },
  { id: "TI-006", type: "IP", value: "91.215.85.194", severity: "high", source: "Shodan", firstSeen: "2026-02-19", lastSeen: "2026-02-27", status: "active" },
  { id: "TI-007", type: "Domain", value: "cryptominer-pool.xyz", severity: "medium", source: "Censys", firstSeen: "2026-02-21", lastSeen: "2026-02-26", status: "resolved" },
  { id: "TI-008", type: "IP", value: "23.129.64.214", severity: "low", source: "TOR Exit Node", firstSeen: "2026-02-10", lastSeen: "2026-02-27", status: "active" },
  { id: "TI-009", type: "Hash", value: "d41d8cd98f00b204e9800998ecf8427e", severity: "critical", source: "Hybrid Analysis", firstSeen: "2026-02-25", lastSeen: "2026-02-27", status: "investigating" },
  { id: "TI-010", type: "IP", value: "103.224.182.250", severity: "high", source: "AbuseIPDB", firstSeen: "2026-02-23", lastSeen: "2026-02-27", status: "active" },
];

// MITRE ATT&CK tactics and techniques
export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  detected: boolean;
  severity: "critical" | "high" | "medium" | "low";
}

export const mitreTactics = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command & Control", "Exfiltration", "Impact"
];

export const mitreTechniques: MitreTechnique[] = [
  { id: "T1190", name: "Exploit Public-Facing App", tactic: "Initial Access", description: "Adversaries exploit vulnerabilities in internet-facing software to gain initial access.", detected: true, severity: "critical" },
  { id: "T1566", name: "Phishing", tactic: "Initial Access", description: "Adversaries send phishing messages to gain access to victim systems.", detected: true, severity: "high" },
  { id: "T1059", name: "Command & Scripting Interpreter", tactic: "Execution", description: "Adversaries abuse command and script interpreters to execute commands.", detected: true, severity: "high" },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution", description: "Adversaries abuse task scheduling to execute malicious code.", detected: false, severity: "medium" },
  { id: "T1547", name: "Boot or Logon Autostart", tactic: "Persistence", description: "Adversaries configure system settings to automatically execute a program during boot.", detected: true, severity: "high" },
  { id: "T1136", name: "Create Account", tactic: "Persistence", description: "Adversaries create accounts to maintain access to victim systems.", detected: false, severity: "medium" },
  { id: "T1548", name: "Abuse Elevation Control", tactic: "Privilege Escalation", description: "Adversaries circumvent mechanisms designed to control elevated privileges.", detected: true, severity: "critical" },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation", description: "Adversaries exploit software vulnerabilities to elevate privileges.", detected: false, severity: "high" },
  { id: "T1070", name: "Indicator Removal", tactic: "Defense Evasion", description: "Adversaries delete or modify artifacts to remove evidence of presence.", detected: true, severity: "high" },
  { id: "T1036", name: "Masquerading", tactic: "Defense Evasion", description: "Adversaries manipulate features of their artifacts to make them appear legitimate.", detected: false, severity: "medium" },
  { id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access", description: "Adversaries attempt to dump credentials to obtain account login information.", detected: true, severity: "critical" },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access", description: "Adversaries use brute force techniques to attempt access to accounts.", detected: true, severity: "high" },
  { id: "T1046", name: "Network Service Discovery", tactic: "Discovery", description: "Adversaries attempt to get a listing of services running on remote hosts.", detected: true, severity: "medium" },
  { id: "T1082", name: "System Information Discovery", tactic: "Discovery", description: "Adversaries attempt to get detailed information about the operating system.", detected: false, severity: "low" },
  { id: "T1021", name: "Remote Services", tactic: "Lateral Movement", description: "Adversaries use valid accounts to log into remote services.", detected: true, severity: "high" },
  { id: "T1570", name: "Lateral Tool Transfer", tactic: "Lateral Movement", description: "Adversaries transfer tools between systems within a compromised environment.", detected: false, severity: "medium" },
  { id: "T1005", name: "Data from Local System", tactic: "Collection", description: "Adversaries search local system sources to find files of interest.", detected: false, severity: "medium" },
  { id: "T1071", name: "Application Layer Protocol", tactic: "Command & Control", description: "Adversaries communicate using OSI application layer protocols to avoid detection.", detected: true, severity: "high" },
  { id: "T1041", name: "Exfiltration Over C2", tactic: "Exfiltration", description: "Adversaries steal data by exfiltrating it over an existing C2 channel.", detected: true, severity: "critical" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", description: "Adversaries encrypt data on target systems to interrupt availability.", detected: false, severity: "critical" },
];

// Network nodes
export interface NetworkNode {
  id: string;
  label: string;
  type: "server" | "workstation" | "firewall" | "router" | "attacker";
  ip: string;
  x: number;
  y: number;
  status: "normal" | "suspicious" | "compromised" | "blocked";
}

export interface NetworkEdge {
  source: string;
  target: string;
  traffic: number;
  suspicious: boolean;
}

export const networkNodes: NetworkNode[] = [
  { id: "fw-1", label: "Firewall", type: "firewall", ip: "10.0.0.1", x: 400, y: 80, status: "normal" },
  { id: "rt-1", label: "Core Router", type: "router", ip: "10.0.1.1", x: 400, y: 180, status: "normal" },
  { id: "srv-web", label: "Web Server", type: "server", ip: "10.0.2.10", x: 200, y: 300, status: "normal" },
  { id: "srv-db", label: "Database", type: "server", ip: "10.0.2.20", x: 400, y: 320, status: "normal" },
  { id: "srv-mail", label: "Mail Server", type: "server", ip: "10.0.2.30", x: 600, y: 300, status: "normal" },
  { id: "ws-1", label: "Workstation 1", type: "workstation", ip: "10.0.3.101", x: 150, y: 440, status: "normal" },
  { id: "ws-2", label: "Workstation 2", type: "workstation", ip: "10.0.3.102", x: 350, y: 440, status: "normal" },
  { id: "ws-3", label: "Workstation 3", type: "workstation", ip: "10.0.3.103", x: 550, y: 440, status: "normal" },
  { id: "atk-1", label: "External Attacker", type: "attacker", ip: "185.220.101.34", x: 100, y: 80, status: "suspicious" },
];

export const networkEdges: NetworkEdge[] = [
  { source: "fw-1", target: "rt-1", traffic: 850, suspicious: false },
  { source: "rt-1", target: "srv-web", traffic: 420, suspicious: false },
  { source: "rt-1", target: "srv-db", traffic: 310, suspicious: false },
  { source: "rt-1", target: "srv-mail", traffic: 180, suspicious: false },
  { source: "srv-web", target: "ws-1", traffic: 95, suspicious: false },
  { source: "srv-db", target: "ws-2", traffic: 70, suspicious: false },
  { source: "srv-mail", target: "ws-3", traffic: 45, suspicious: false },
  { source: "atk-1", target: "fw-1", traffic: 1200, suspicious: true },
];

// Attack types for simulation
export const attackTypes = [
  { value: "ddos", label: "DDoS Attack", mitre: "T1498" },
  { value: "sqli", label: "SQL Injection", mitre: "T1190" },
  { value: "phishing", label: "Spear Phishing", mitre: "T1566" },
  { value: "ransomware", label: "Ransomware", mitre: "T1486" },
  { value: "bruteforce", label: "Brute Force", mitre: "T1110" },
  { value: "c2", label: "C2 Communication", mitre: "T1071" },
];

// Log generator
export function generateLogEntry(attackType?: string): string {
  const timestamps = new Date().toISOString();
  const ips = ["185.220.101.34", "45.155.205.233", "91.215.85.194", "103.224.182.250", "23.129.64.214"];
  const srcIp = ips[Math.floor(Math.random() * ips.length)];
  const dstIp = `10.0.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 254) + 1}`;
  const severities = ["INFO", "WARN", "ERROR", "CRITICAL"];
  const sev = attackType ? severities[Math.floor(Math.random() * 2) + 2] : severities[Math.floor(Math.random() * severities.length)];
  
  const messages: Record<string, string[]> = {
    ddos: [
      `SYN flood detected from ${srcIp} → ${dstIp}:443 (${Math.floor(Math.random() * 50000)} pps)`,
      `Rate limit exceeded: ${srcIp} → ${dstIp} (${Math.floor(Math.random() * 10000)} req/s)`,
    ],
    sqli: [
      `SQL injection attempt: ${srcIp} → ${dstIp}:3306 payload="' OR 1=1 --"`,
      `WAF blocked SQLi: ${srcIp} UNION SELECT from users`,
    ],
    phishing: [
      `Phishing email detected from ${srcIp}: subject="Urgent: Password Reset"`,
      `Malicious attachment blocked: ${srcIp} → ${dstIp} file=invoice.exe`,
    ],
    ransomware: [
      `Ransomware signature detected: ${srcIp} → ${dstIp} encrypting /data/*`,
      `Anomalous file encryption: 847 files modified in 30s on ${dstIp}`,
    ],
    bruteforce: [
      `Failed SSH login from ${srcIp} → ${dstIp}:22 (attempt ${Math.floor(Math.random() * 500)})`,
      `Brute force detected: ${srcIp} → ${dstIp}:22 (${Math.floor(Math.random() * 100)} attempts/min)`,
    ],
    c2: [
      `C2 beacon detected: ${dstIp} → ${srcIp}:8443 interval=30s`,
      `DNS tunneling: ${dstIp} → suspicious.evil.net (encoded payload)`,
    ],
  };

  const defaultMsgs = [
    `Connection established: ${srcIp} → ${dstIp}:${[80, 443, 22, 3306, 8080][Math.floor(Math.random() * 5)]}`,
    `Packet inspection: ${srcIp} → ${dstIp} protocol=TCP flags=SYN,ACK`,
    `Firewall rule matched: ALLOW ${srcIp} → ${dstIp}`,
  ];

  const pool = attackType && messages[attackType] ? messages[attackType] : defaultMsgs;
  const msg = pool[Math.floor(Math.random() * pool.length)];

  return `[${timestamps}] [${sev}] ${msg}`;
}
