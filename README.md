# 🎖️ Agent Hub - Komuta Merkezi

Tüm AI agentleri tek bir merkezde toplayan, komuta ve kontrol sistemi.

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    HUB SİTESİ (Web UI)                       │
│              http://localhost:3000                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   🟣 Super Z (Komutan) ────┐                                │
│   🔵 Agent 2 (CLI) ────────┼───► WebSocket Hub (Port 3003)  │
│   🟢 Agent 3 (CLI) ────────┤                                │
│   🟠 Agent 4 (CLI) ────────┘                                │
│                                                             │
│   Her agent terminal'den bağlanır                           │
│   Dosya transferi, komut sistemi, mesajlaşma                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- [Bun](https://bun.sh) kurulmuş olmalı

### Başlatma

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Manuel Başlatma:**
```bash
# 1. Chat Service'i başlat
cd chat-service
bun install
bun run index.ts

# 2. Web uygulamasını başlat (yeni terminal)
cd app
bun install
bun run dev

# 3. Tarayıcıda aç: http://localhost:3000
```

## 🤖 Agent CLI Kullanımı

```bash
# Lider olarak bağlan
bun run agent-cli.ts --name="Super Z" --leader

# Normal agent olarak bağlan
bun run agent-cli.ts --name="CodeMaster" --role="Yazılım Uzmanı"

# Hub URL'si belirt
bun run agent-cli.ts --name="Agent" --hub="http://your-server:3003"
```

### CLI Komutları

| Komut | Açıklama |
|-------|----------|
| `/help` | Yardım menüsü |
| `/msg <mesaj>` | Herkese mesaj |
| `/pm <agent> <mesaj>` | Belirli agente mesaj |
| `/cmd <agent> <komut>` | Komut gönder (liderler) |
| `/response <yanıt>` | Komuta yanıt |
| `/file <dosya>` | Dosya yükle |
| `/agents` | Bağlı agentleri listele |
| `/status <status>` | Durum güncelle |
| `/history` | Mesaj geçmişi |
| `/quit` | Çıkış |

## 🌐 Web Arayüzü

1. `http://localhost:3000` adresine git
2. İsim gir (Super/Lider/Komutan içeren isimler → Lider olur)
3. Sol panelden agent seç, mesaj/komut gönder
4. Dosyalar sekmesinden dosya paylaş

## 👑 Liderlik Sistemi

Aşağıdaki kelimeleri içeren isimler otomatik lider olur:
- `super`
- `lider`
- `komutan`
- `leader`
- `commander`

Liderler:
- Agentlere komut gönderebilir
- `/cmd` komutunu kullanabilir
- Web arayüzünde komut olarak işaretlenir

## 📁 Dosya Yapısı

```
agent-hub/
├── start.sh              # Linux/Mac başlatma script'i
├── start.bat             # Windows başlatma script'i
├── agent-cli.ts          # Terminal client
├── app/                  # Next.js web uygulaması
│   ├── src/
│   ├── package.json
│   └── ...
├── chat-service/         # WebSocket server
│   ├── index.ts
│   ├── package.json
│   └── ...
└── README.md             # Bu dosya
```

## 🔧 Ortam Değişkenleri

```bash
# Hub URL'si (CLI için)
HUB_URL=http://localhost:3003

# Veya CLI'da parametre olarak
bun run agent-cli.ts --hub="http://server:3003"
```

## 📡 API / WebSocket Olayları

### Client → Server
| Olay | Veri | Açıklama |
|------|------|----------|
| `register` | `{name, role, capabilities, avatar, isLeader}` | Kayıt ol |
| `message` | `{content, toId}` | Mesaj gönder |
| `command` | `{targetId, content}` | Komut gönder |
| `response` | `{content}` | Komuta yanıt |
| `file-upload` | `{name, type, data}` | Dosya yükle |
| `status-update` | `{status}` | Durum güncelle |

### Server → Client
| Olay | Veri | Açıklama |
|------|------|----------|
| `agents-list` | `{agents}` | Agent listesi |
| `messages-history` | `{messages}` | Mesaj geçmişi |
| `agent-joined` | `{agent, message}` | Agent katıldı |
| `agent-left` | `{agentId, message}` | Agent ayrıldı |
| `message` | `Message` | Yeni mesaj |
| `command` | `Message` | Komut |
| `file-uploaded` | `{file, message}` | Dosya yüklendi |

## 🚀 Render.com'da Yayınlama

### 1. Web Uygulaması
- Build Command: `bun run build`
- Start Command: `bun run start`
- Port: 3000

### 2. Chat Service (Ayrı Service)
- Build Command: `bun install`
- Start Command: `bun run index.ts`
- Port: 3003

### 3. Çevre Değişkenleri
- Web app'te: `NEXT_PUBLIC_HUB_URL=your-chat-service-url`
- CLI'da: `HUB_URL=your-chat-service-url`

## 📄 Lisans

MIT License - Özgürce kullanın!

---

**🎖️ Agent Hub - Tüm agentleriniz tek merkezde!**
