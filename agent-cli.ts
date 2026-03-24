#!/usr/bin/env bun
/**
 * 🤖 AGENT CLI CLIENT
 * 
 * Terminal'den Agent Hub'a bağlanmak için kullanılır.
 * 
 * Kullanım:
 *   bun run agent-cli.ts --name="Super Z" --leader
 *   bun run agent-cli.ts --name="CodeMaster"
 */

import * as readline from 'readline'
import { io } from 'socket.io-client'
import * as fs from 'fs'
import * as path from 'path'

// Parse command line args
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=')
  acc[key] = value || true
  return acc
}, {} as Record<string, string | boolean>)

// Configuration - Hub URL'yi dışarıdan alabilir
const CONFIG = {
  name: (args.name as string) || `Agent-${Math.random().toString(36).substr(2, 4)}`,
  role: (args.role as string) || 'Agent',
  capabilities: ((args.capabilities as string) || '').split(',').filter(Boolean),
  hubUrl: (args.hub as string) || process.env.HUB_URL || 'http://localhost:3003',
  avatar: (args.avatar as string) || '🤖',
  isLeader: (args.leader as boolean) || false,
}

// Check for leader name
if (CONFIG.name.toLowerCase().includes('super') || 
    CONFIG.name.toLowerCase().includes('lider') ||
    CONFIG.name.toLowerCase().includes('komutan') ||
    CONFIG.name.toLowerCase().includes('leader') ||
    CONFIG.name.toLowerCase().includes('commander')) {
  CONFIG.isLeader = true
  CONFIG.avatar = '🟣'
}

// Colors
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

// State
let socket: any = null
let isConnected = false
const messageHistory: any[] = []

// Log helpers
const log = {
  system: (msg: string) => console.log(`${c.cyan}[SİSTEM]${c.reset} ${msg}`),
  info: (msg: string) => console.log(`${c.blue}[BİLGİ]${c.reset} ${msg}`),
  message: (from: string, color: string, msg: string) => 
    console.log(`${color}[${from}]${c.reset} ${msg}`),
  command: (from: string, msg: string) => 
    console.log(`${c.red}${c.bold}[KOMUT - ${from}]${c.reset} ${c.yellow}${msg}${c.reset}`),
  error: (msg: string) => console.log(`${c.red}[HATA]${c.reset} ${msg}`),
  success: (msg: string) => console.log(`${c.green}[✓]${c.reset} ${msg}`),
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${c.green}${CONFIG.name}${c.reset} > `
})

// Connect to Hub
function connect() {
  log.info(`Hub'a bağlanılıyor: ${CONFIG.hubUrl}`)
  
  socket = io(CONFIG.hubUrl, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    isConnected = true
    log.success('Hub\'a bağlandı!')
    
    socket.emit('register', {
      name: CONFIG.name,
      role: CONFIG.role,
      capabilities: CONFIG.capabilities,
      avatar: CONFIG.avatar,
      isLeader: CONFIG.isLeader,
      socketType: 'cli'
    })

    rl.prompt()
  })

  socket.on('disconnect', () => {
    isConnected = false
    log.error('Hub bağlantısı koptu! Yeniden bağlanılıyor...')
  })

  socket.on('agents-list', (data: { agents: any[] }) => {
    log.info(`${data.agents.length} agent bağlı`)
  })

  socket.on('agent-joined', (data: { agent: any; message: any }) => {
    const agent = data.agent
    const badge = agent.isLeader ? ' 👑' : ''
    log.system(`${agent.name} katıldı!${badge}`)
    rl.prompt()
  })

  socket.on('agent-left', (data: { agentId: string; message: any }) => {
    log.system(data.message.content)
    rl.prompt()
  })

  socket.on('message', (msg: any) => {
    if (msg.fromId === socket.id) return
    messageHistory.push(msg)
    log.message(msg.fromName, c.cyan, msg.content)
    rl.prompt()
  })

  socket.on('command', (cmd: any) => {
    if (cmd.toId !== socket.id && cmd.toId !== 'all') return
    messageHistory.push(cmd)
    log.command(cmd.fromName, cmd.content)
    console.log(`${c.yellow}└─ Yanıtlamak için: /response <yanıt>${c.reset}`)
    rl.prompt()
  })

  socket.on('messages-history', (data: { messages: any[] }) => {
    messageHistory.length = 0
    messageHistory.push(...data.messages)
  })

  socket.on('file-uploaded', (data: { file: any; message: any }) => {
    log.system(`${data.file.uploadedByName} dosya yükledi: ${data.file.name}`)
    rl.prompt()
  })

  socket.on('error', (err: any) => {
    log.error(err.message || 'Bilinmeyen hata')
  })
}

// Send message
function sendMessage(content: string, toId: string = 'all') {
  if (!isConnected) {
    log.error('Bağlantı yok!')
    return
  }
  socket.emit('message', { content, toId })
}

// Send command (leaders only)
function sendCommand(targetId: string, content: string) {
  if (!isConnected) {
    log.error('Bağlantı yok!')
    return
  }
  if (!CONFIG.isLeader) {
    log.error('Sadece liderler komut gönderebilir!')
    return
  }
  socket.emit('command', { targetId, content })
}

// Send response
function sendResponse(content: string) {
  if (!isConnected) {
    log.error('Bağlantı yok!')
    return
  }
  socket.emit('response', { content })
}

// Upload file
function uploadFile(filePath: string) {
  if (!isConnected) {
    log.error('Bağlantı yok!')
    return
  }

  const fullPath = path.resolve(filePath)
  if (!fs.existsSync(fullPath)) {
    log.error(`Dosya bulunamadı: ${fullPath}`)
    return
  }

  const fileContent = fs.readFileSync(fullPath)
  const base64 = fileContent.toString('base64')
  const fileName = path.basename(fullPath)

  socket.emit('file-upload', {
    name: fileName,
    type: 'application/octet-stream',
    data: base64
  })

  log.success(`Dosya yükleniyor: ${fileName}`)
}

// Show help
function showHelp() {
  console.log(`
${c.bold}KOMUTLAR:${c.reset}
  /help                    - Bu yardım menüsü
  /msg <mesaj>             - Herkese mesaj
  /pm <agent> <mesaj>      - Belirli agente mesaj
  /cmd <agent> <komut>     - Komut gönder (liderler)
  /response <yanıt>        - Komuta yanıt
  /file <dosya_yolu>       - Dosya yükle
  /agents                  - Bağlı agentleri listele
  /status <status>         - Durum güncelle
  /history                 - Mesaj geçmişi
  /clear                   - Ekranı temizle
  /quit                    - Çıkış
`)
}

// Handle input
rl.on('line', (input) => {
  const trimmed = input.trim()
  
  if (!trimmed) {
    rl.prompt()
    return
  }

  if (trimmed.startsWith('/')) {
    const parts = trimmed.split(' ')
    const cmd = parts[0].toLowerCase()
    const cmdArgs = parts.slice(1)

    switch (cmd) {
      case '/help':
        showHelp()
        break
      case '/msg':
        sendMessage(cmdArgs.join(' '))
        break
      case '/pm':
        if (cmdArgs.length >= 2) {
          sendMessage(`[DM to ${cmdArgs[0]}] ${cmdArgs.slice(1).join(' ')}`)
        } else {
          log.error('Kullanım: /pm <agent> <mesaj>')
        }
        break
      case '/cmd':
        if (cmdArgs.length >= 2) {
          sendCommand(cmdArgs[0], cmdArgs.slice(1).join(' '))
        } else {
          log.error('Kullanım: /cmd <agent_id|all> <komut>')
        }
        break
      case '/response':
        if (cmdArgs.length >= 1) {
          sendResponse(cmdArgs.join(' '))
        } else {
          log.error('Kullanım: /response <yanıt>')
        }
        break
      case '/file':
        if (cmdArgs.length >= 1) {
          uploadFile(cmdArgs[0])
        } else {
          log.error('Kullanım: /file <dosya_yolu>')
        }
        break
      case '/agents':
        socket.emit('get-agents')
        break
      case '/status':
        const status = cmdArgs[0] || 'online'
        if (['online', 'busy', 'offline'].includes(status)) {
          socket.emit('status-update', { status })
          log.success(`Durum güncellendi: ${status}`)
        } else {
          log.error('Geçersiz durum. Kullanılabilir: online, busy, offline')
        }
        break
      case '/history':
        console.log(`\n${c.bold}--- MESAJ GEÇMİŞİ ---${c.reset}`)
        messageHistory.slice(-20).forEach(msg => {
          if (msg.type === 'system') {
            console.log(`${c.cyan}[SİSTEM] ${msg.content}${c.reset}`)
          } else if (msg.type === 'command') {
            console.log(`${c.red}[KOMUT] ${msg.fromName}: ${msg.content}${c.reset}`)
          } else {
            console.log(`${msg.fromName}: ${msg.content}`)
          }
        })
        console.log(`${c.bold}---------------------${c.reset}\n`)
        break
      case '/clear':
        console.clear()
        break
      case '/quit':
      case '/exit':
        log.info('Çıkılıyor...')
        socket?.disconnect()
        rl.close()
        process.exit(0)
      default:
        log.error(`Bilinmeyen komut: ${cmd}`)
        log.info('Yardım için: /help')
    }
  } else {
    sendMessage(trimmed)
  }

  rl.prompt()
})

rl.on('close', () => {
  socket?.disconnect()
  process.exit(0)
})

// Start
console.log(`
${c.bold}${c.magenta}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 AGENT CLI CLIENT                                     ║
║                                                           ║
║   Agent: ${CONFIG.name}
║   Role: ${CONFIG.role}
║   ${CONFIG.isLeader ? c.yellow + '👑 LIDER MODU' + c.reset : 'Agent Modu'}
║                                                           ║
║   Yardım için: /help                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${c.reset}
`)

connect()
