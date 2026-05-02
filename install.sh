#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  Feudle Installer
#  Run with: sudo bash install.sh
# ─────────────────────────────────────────────

REPO="https://github.com/sunnyrabiussunny/feudle.git"
INSTALL_DIR="/opt/feudle"
SERVICE_NAME="feudle"
PORT=3456

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ███████╗███████╗██╗   ██╗██████╗ ██╗     ███████╗"
echo "  ██╔════╝██╔════╝██║   ██║██╔══██╗██║     ██╔════╝"
echo "  █████╗  █████╗  ██║   ██║██║  ██║██║     █████╗  "
echo "  ██╔══╝  ██╔══╝  ██║   ██║██║  ██║██║     ██╔══╝  "
echo "  ██║     ███████╗╚██████╔╝██████╔╝███████╗███████╗"
echo "  ╚═╝     ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Family Feud · Live · Self-Hosted${NC}"
echo ""

# Must run as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash install.sh${NC}"
  exit 1
fi

# ── Step 1: Update system ──────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Updating package list…${NC}"
apt-get update -qq

# ── Step 2: Install Node.js 20 ────────────────────────────────────────────
echo -e "${YELLOW}[2/5] Installing Node.js 20…${NC}"
if ! command -v node &>/dev/null || [ "$(node -e 'process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)' 2>/dev/null; echo $?)" = "1" ]; then
  apt-get install -y -qq curl git
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs
else
  echo -e "   ${GREEN}Node.js already installed: $(node -v)${NC}"
fi

# ── Step 3: Clone or update repo ──────────────────────────────────────────
echo -e "${YELLOW}[3/5] Downloading Feudle…${NC}"
apt-get install -y -qq git > /dev/null 2>&1
if [ -d "$INSTALL_DIR/.git" ]; then
  echo -e "   Updating existing installation…"
  git -C "$INSTALL_DIR" pull --quiet
else
  git clone --quiet "$REPO" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"
npm install --quiet --omit=dev

# ── Step 4: Create systemd service ────────────────────────────────────────
echo -e "${YELLOW}[4/5] Setting up system service…${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Feudle - Family Feud Live Quiz
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=PORT=${PORT}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" --quiet
systemctl restart "$SERVICE_NAME"

# ── Step 5: Firewall ──────────────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Configuring firewall…${NC}"
if command -v ufw &>/dev/null; then
  ufw allow ${PORT}/tcp > /dev/null 2>&1 || true
fi

# ── Done ──────────────────────────────────────────────────────────────────
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}${BOLD}✓ Feudle installed successfully!${NC}"
echo ""
echo -e "  ${BOLD}Open on this machine:${NC}"
echo -e "    Players  →  ${CYAN}http://localhost:${PORT}/${NC}"
echo -e "    Manager  →  ${CYAN}http://localhost:${PORT}/manager.html${NC}"
echo ""
echo -e "  ${BOLD}Open from another device on your network:${NC}"
echo -e "    Players  →  ${CYAN}http://${LOCAL_IP}:${PORT}/${NC}"
echo -e "    Manager  →  ${CYAN}http://${LOCAL_IP}:${PORT}/manager.html${NC}"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    sudo systemctl status feudle    → check if running"
echo -e "    sudo systemctl restart feudle   → restart"
echo -e "    sudo systemctl stop feudle      → stop"
echo -e "    sudo journalctl -u feudle -f    → view live logs"
echo ""
