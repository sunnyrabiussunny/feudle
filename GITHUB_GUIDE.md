# 📤 How to Upload Feudle to GitHub

---

## Step 1 — Create a GitHub Account

Go to https://github.com and sign up for a free account if you don't have one.

---

## Step 2 — Create a New Repository

1. Click the **+** button (top right) → **New repository**
2. Repository name: `feudle`
3. Description: `Family Feud style live quiz game`
4. Set to **Public** (so others can clone it) or **Private**
5. ❌ Do NOT tick "Add a README" — we already have one
6. Click **Create repository**

---

## Step 3 — Install Git on Ubuntu

```bash
sudo apt install git -y

git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Step 4 — Initialize the Project

```bash
cd /path/to/feudle

git init
git add .
git commit -m "Initial commit — Feudle v1.0"
```

---

## Step 5 — Get a GitHub Personal Access Token

GitHub no longer accepts passwords for pushing. You need a token:

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name like `feudle-push`
4. Check the **repo** scope
5. Click **Generate token**
6. **Copy the token** — you only see it once

---

## Step 6 — Push to GitHub

```bash
git remote add origin https://github.com/sunnyrabiussunny/feudle.git
git branch -M main
git push -u origin main
```

When asked for a password — paste your **Personal Access Token** (not your GitHub password).

---

## Step 7 — Update the Install Script

After pushing, edit `install.sh` and replace this line:

```bash
REPO="https://github.com/sunnyrabiussunny/feudle.git"
```

with your actual repo URL, then push again:

```bash
git add install.sh
git commit -m "Update install script with real repo URL"
git push
```

---

## Step 8 — Future Updates

Any time you change code or questions:

```bash
git add .
git commit -m "What you changed"
git push
```

---

## Step 9 — Install on Any Ubuntu Machine from GitHub

```bash
curl -fsSL https://raw.githubusercontent.com/sunnyrabiussunny/feudle/main/install.sh -o install.sh
sudo bash install.sh
```

Or manually:

```bash
git clone https://github.com/sunnyrabiussunny/feudle.git
cd feudle
npm install
npm start
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Permission denied (publickey)` | Use HTTPS URL, not SSH. Make sure URL starts with `https://` |
| `Authentication failed` | Use Personal Access Token as password, not your GitHub password |
| `remote origin already exists` | Run: `git remote set-url origin https://github.com/sunnyrabiussunny/feudle.git` |
