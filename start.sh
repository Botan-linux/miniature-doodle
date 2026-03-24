#!/bin/bash
# 🎖️ Agent Hub - Başlatma Script'i (Linux/Mac)

echo "═══════════════════════════════════════════════════════════"
echo "                                                           "
echo "   🎖️  AGENT HUB BAŞLATILIYOR...                           "
echo "                                                           "
echo "═══════════════════════════════════════════════════════════"

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Bağımlılıkları kontrol et
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun bulunamadı, yükleniyor...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Ana dizin
cd "$(dirname "$0")"
ROOT_DIR=$(pwd)

echo -e "${BLUE}[1/4] Bağımlılıklar yükleniyor...${NC}"
cd "$ROOT_DIR/app"
bun install

cd "$ROOT_DIR/chat-service"
bun install

echo -e "${BLUE}[2/4] Chat Service başlatılıyor (Port 3003)...${NC}"
cd "$ROOT_DIR/chat-service"
bun run index.ts &
CHAT_PID=$!
sleep 2

echo -e "${BLUE}[3/4] Web uygulaması başlatılıyor (Port 3000)...${NC}"
cd "$ROOT_DIR/app"
bun run dev &
WEB_PID=$!

echo ""
echo -e "${GREEN}✅ Agent Hub çalışıyor!${NC}"
echo ""
echo "   🌐 Web Arayüzü: http://localhost:3000"
echo "   🔌 WebSocket:   ws://localhost:3003"
echo ""
echo "   📋 Agent CLI ile bağlanmak için yeni terminal açın:"
echo "      cd $ROOT_DIR"
echo "      bun run agent-cli.ts --name=\"AgentAdı\""
echo ""
echo "   Durdurmak için: Ctrl+C"
echo ""

# Trap for cleanup
trap "echo ''; echo 'Durduruluyor...'; kill $CHAT_PID $WEB_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for processes
wait
