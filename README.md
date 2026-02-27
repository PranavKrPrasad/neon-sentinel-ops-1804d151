# 🛡️ AI-IDS – Cyberpunk AI Intrusion Detection System

![Status](https://img.shields.io/badge/status-hackathon--ready-00FF9C)
![Tech](https://img.shields.io/badge/stack-Next.js%20%7C%20Node.js%20%7C%20PostgreSQL-00C8FF)
![Theme](https://img.shields.io/badge/UI-Cyberpunk%20SOC-9D00FF)
![License](https://img.shields.io/badge/license-MIT-FF003C)

> 🚨 A full-stack AI-powered Intrusion Detection System with a futuristic Cyberpunk SOC dashboard, real-time attack simulation, MITRE ATT&CK mapping, and explainable AI assistant.

---

# 🌌 Live Concept

AI-IDS simulates real-time cyber threats and demonstrates how an intelligent SOC system can detect, classify, and explain attacks with visual analytics and MITRE mapping.

---

# 🧠 Key Features

## ⚡ Real-Time Attack Simulation
- DDoS
- SQL Injection
- Phishing
- Brute Force
- Ransomware
- Live WebSocket streaming
- Real-time dashboard updates

## 🤖 AI Assistant
- Explain detected attacks
- Show confidence score
- Suggest mitigation steps
- Highlight MITRE technique mapping
- Generate incident reports

## 🗺 MITRE ATT&CK Mapping
- Interactive matrix
- Auto-highlight triggered techniques
- Clickable technique detail modal

## 🌐 Network Monitoring
- Interactive topology graph
- Suspicious nodes pulse red
- Block IP action button

## 🔍 Threat Intelligence
- IOC database
- CVE search
- Auto-match malicious indicators

## 🖥 SOC Full-Screen Mode
- Immersive command center
- Live terminal logs
- Global attack map
- Critical alert banner

---

# 🏗️ System Architecture

```mermaid
graph TD

User --> Frontend[Next.js Cyberpunk UI]
Frontend -->|REST API| Backend(Node.js + Express)
Frontend -->|WebSocket| Realtime(Socket.io Server)

Backend --> Database[(PostgreSQL)]
Backend --> AIEngine[AI Detection Engine]

AIEngine --> Backend
Backend --> Frontend

SimulationEngine --> Backend
Backend --> Realtime
Realtime --> Frontend
