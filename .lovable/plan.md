

# AI-IDS Cyber Defense System — Full Build Plan

## 🎨 Phase 1: Cyberpunk Theme Foundation

### Dark Hacker Design System
- Custom color palette: deep blacks (#050505, #0A0F1C), neon green (#00FF9C), electric blue (#00C8FF), neon purple (#9D00FF), alert red (#FF003C), warning amber (#FFB800)
- Glassmorphism card components with blur and 10% transparency
- Neon glow effects on borders, buttons, and interactive elements
- Typography: Inter for body, JetBrains Mono for terminal/code areas
- Uppercase headings with letter spacing

### Global Background & Effects
- Animated CSS grid background with subtle scan-line overlay
- Particle network animation (lightweight canvas-based)
- Digital noise overlay (very subtle)
- Cyber loading spinner and glitch transition effects
- Page navigation glitch animation

---

## 📊 Phase 2: Main Dashboard

### Top Banner
- "AI-IDS CYBER DEFENSE ACTIVE" with neon glow and pulse animation

### Stats Cards
- Neon-outlined cards showing: Total Threats, Blocked Attacks, Active Alerts, System Uptime
- Each with glow hover effects

### AI Confidence Score
- Circular glowing meter (radial gauge) showing detection confidence

### Global Attack Map
- SVG world map with neon connection lines showing attack origins/targets
- Threats pulse in red, defended in green

### Live Traffic Graph
- Real-time line chart in neon green using Recharts
- Animated data flow visualization

### Moving Background Particles
- Subtle particle effect behind dashboard content

---

## 🤖 Phase 3: AI Assistant Panel

### Floating AI Icon
- Circular neon green pulsing icon (bottom-right)

### Chat Panel
- Slides in with glitch animation
- Terminal-styled chat UI (dark background, monospace font)
- AI responses typed character-by-character with blinking cursor
- Neon keyword highlighting for IPs, CVEs, attack types

### Quick Action Buttons
- "Explain Attack", "Show MITRE Mapping", "Generate Incident Report"
- Neon-bordered action buttons

---

## 🧪 Phase 4: Simulation Lab

### Attack Simulation Controls
- Select attack type, intensity, target
- Launch button with neon glow

### Active Simulation Effects
- Red warning overlay on entire UI during simulation
- Screen shake for critical attacks
- Flashing "INTRUSION DETECTED" banner
- Attack intensity neon pulse bars

### Results Panel
- Defense Score (glows green if high)
- Detection Delay (flashes if slow)
- Detailed breakdown of simulation results

---

## 🖥️ Phase 5: SOC Full-Screen Mode

### Immersive View
- Full black background with huge neon SVG world map
- Red laser-like lines for attack paths
- Live logs in terminal style with monospace font and blinking cursor
- Critical alerts flash red
- Optional alarm sound toggle

---

## 🔍 Phase 6: Threat Intelligence Page

### Threat Indicators
- Known malicious indicators glow red, safe ones glow green
- Neon-bordered badge system
- CVE hover popups with glitch animation
- Searchable threat database table

---

## 🗺️ Phase 7: MITRE ATT&CK Mapping

### Interactive Matrix
- Grid with neon borders
- Active techniques highlighted in purple glow
- Click to open floating cyber modal with technique details
- Attack lifecycle progress animation bar

---

## 🌐 Phase 8: Network Monitoring

### Network Topology View
- Node-based network graph with soft glow
- Suspicious nodes pulse red
- Connection lines with animated moving light
- "Block IP" button glows red on hover
- Real-time traffic stats per node

---

## ⚙️ Phase 9: Backend (Lovable Cloud + Supabase)

### Database Tables
- Threats, alerts, network events, simulation results, threat intel, chat messages, user profiles
- Row-level security policies

### Authentication
- Login/signup with cyberpunk-styled auth pages
- Role-based access (analyst, admin, SOC operator)

### Edge Functions
- AI-powered threat analysis (using Lovable AI)
- Threat classification and scoring
- Incident report generation
- MITRE ATT&CK technique mapping

### Real-time
- Supabase real-time subscriptions for live threat feeds and alerts

---

## 📱 Phase 10: Polish & Responsiveness

- Fully responsive across desktop, tablet, and mobile
- Dark mode as default, optional light mode
- Accessibility: proper contrast ratios maintained despite neon effects
- Smooth transitions and consistent animation timing throughout

