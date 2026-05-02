# 🎮 Feudle

**Feudle** is a self-hosted, open-source Family Feud style live quiz game. Players type free-text answers — the most popular answer group wins points. No multiple choice. No predefined correct answers. Just people thinking alike.

> ⚠️ This project is still under development. Report bugs or suggestions in [issues](../../issues).

---

## 🧩 What is this?

Players join from their phones, see a question like **"What do people do at night?"**, and type any answer they want. The game automatically groups similar answers (`sleep`, `sleeping`, `slept` → same group) and the biggest group wins 10 points each round.

Think **Kahoot** interface + **Family Feud** scoring.

---

## ⚙️ Prerequisites

- Node.js version 18 or higher

---

## 📖 Getting Started

**Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/feudle.git
cd feudle
```

**Install dependencies:**
```bash
npm install
```

**Start the server:**
```bash
npm start
```

Open:
- **Host screen:** http://localhost:3456/manager.html
- **Players join at:** http://localhost:3456/

---

## 🚀 One-Command Install (Ubuntu)

For a full self-hosted Ubuntu install that runs as a background service:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/feudle/main/install.sh -o install.sh
sudo bash install.sh
```

That's it. Feudle will be running at **http://YOUR-IP:3456** and will auto-start on reboot.

---

## 🎮 How to Play

**As host:**
1. Open `/manager.html` in a browser (on a TV or shared screen)
2. Click **Create Room** — a 6-digit code appears
3. Share the code and your IP with players
4. Wait for players to join, then click **Start Game**
5. After each round: click **Leaderboard** then **Next Question**

**As player:**
1. Open the player URL on your phone
2. Enter the 6-digit room code
3. Enter your name
4. Wait for the host to start
5. When the question appears — type your answer and hit Submit

---

## ⚙️ Configuration

**Change the port:**
```bash
PORT=8080 npm start
```

**Edit questions** — open `questions.json`:
```json
[
  {
    "question": "Name something you find in a kitchen.",
    "time": 25
  }
]
```

Restart the server after editing questions.

---

## 📝 Contributing

1. Fork the repository
2. Create a branch (`feat/my-feature`)
3. Commit and push your changes
4. Open a pull request

---

## 📄 License

MIT
