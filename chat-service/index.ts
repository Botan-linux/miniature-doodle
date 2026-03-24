import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 50e6 // 50MB for file transfers
})

// Types
interface Agent {
  id: string
  name: string
  role: string
  avatar: string
  color: string
  capabilities: string[]
  status: 'online' | 'busy' | 'offline'
  connectedAt: Date
  isLeader: boolean
  socketType: 'web' | 'cli' // web interface or CLI agent
}

interface Message {
  id: string
  fromId: string
  fromName: string
  fromAvatar: string
  fromColor: string
  toId: string | 'all' | 'leaders'
  content: string
  type: 'message' | 'command' | 'response' | 'system' | 'file'
  fileName?: string
  fileSize?: number
  fileData?: string // base64
  timestamp: Date
}

interface FileTransfer {
  id: string
  name: string
  size: number
  type: string
  data: string // base64
  uploadedBy: string
  uploadedByName: string
  timestamp: Date
}

// State
const agents = new Map<string, Agent>()
const messages: Message[] = []
const files: FileTransfer[] = []
const leaderIds = new Set<string>() // Leaders can give commands

const generateId = () => Math.random().toString(36).substr(2, 9)

// Default colors for agents
const agentColors = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
]
let colorIndex = 0

const getNextColor = () => {
  const color = agentColors[colorIndex % agentColors.length]
  colorIndex++
  return color
}

// System message helper
const createSystemMessage = (content: string): Message => ({
  id: generateId(),
  fromId: 'system',
  fromName: 'Sistem',
  fromAvatar: '⚙️',
  fromColor: '#6B7280',
  toId: 'all',
  content,
  type: 'system',
  timestamp: new Date()
})

// Broadcast agent list to all
const broadcastAgentList = () => {
  const agentList = Array.from(agents.values())
  io.emit('agents-list', { agents: agentList })
}

// Broadcast file list
const broadcastFileList = () => {
  io.emit('files-list', { files })
}

// Check if agent name indicates leadership
const isLeaderName = (name: string): boolean => {
  const leaderKeywords = ['super z', 'super-z', 'superz', 'leader', 'komutan', 'lider', 'commander']
  return leaderKeywords.some(keyword => name.toLowerCase().includes(keyword))
}

// Socket Connection Handler
io.on('connection', (socket: Socket) => {
  console.log(`[CONNECT] ${socket.id}`)

  // Send current state to new connection
  socket.emit('agents-list', { agents: Array.from(agents.values()) })
  socket.emit('messages-history', { messages: messages.slice(-100) })
  socket.emit('files-list', { files })

  // ============ AGENT REGISTRATION ============
  socket.on('register', (data: {
    name: string
    role?: string
    capabilities?: string[]
    avatar?: string
    isLeader?: boolean
    socketType?: 'web' | 'cli'
  }) => {
    const agentName = data.name || `Agent-${socket.id.substr(0, 4)}`
    const isLeader = data.isLeader || isLeaderName(agentName)
    
    const agent: Agent = {
      id: socket.id,
      name: agentName,
      role: data.role || 'Agent',
      avatar: data.avatar || '🤖',
      color: getNextColor(),
      capabilities: data.capabilities || [],
      status: 'online',
      connectedAt: new Date(),
      isLeader,
      socketType: data.socketType || 'cli'
    }

    agents.set(socket.id, agent)
    
    if (isLeader) {
      leaderIds.add(socket.id)
    }

    // Broadcast join
    const joinMsg = createSystemMessage(`${agentName} katıldı! ${isLeader ? '👑 LIDER' : ''}`)
    messages.push(joinMsg)
    
    io.emit('agent-joined', { agent, message: joinMsg })
    broadcastAgentList()

    console.log(`[REGISTER] ${agentName} (${socket.id}) ${isLeader ? '- LEADER' : ''}`)
  })

  // ============ MESSAGES & COMMANDS ============
  socket.on('message', (data: { content: string; toId?: string }) => {
    const agent = agents.get(socket.id)
    if (!agent) return

    const toId = data.toId || 'all'
    
    const message: Message = {
      id: generateId(),
      fromId: socket.id,
      fromName: agent.name,
      fromAvatar: agent.avatar,
      fromColor: agent.color,
      toId,
      content: data.content,
      type: agent.isLeader ? 'command' : 'message',
      timestamp: new Date()
    }

    messages.push(message)

    if (toId === 'all') {
      io.emit('message', message)
    } else if (toId === 'leaders') {
      // Send to leaders only
      leaderIds.forEach(leaderId => {
        io.to(leaderId).emit('message', message)
      })
    } else {
      // Send to specific agent
      io.to(toId).emit('message', message)
      // Also send back to sender
      socket.emit('message', message)
    }

    console.log(`[MSG] ${agent.name} -> ${toId}: ${data.content.substr(0, 50)}...`)
  })

  // Response to a command
  socket.on('response', (data: { commandId: string; content: string }) => {
    const agent = agents.get(socket.id)
    if (!agent) return

    const message: Message = {
      id: generateId(),
      fromId: socket.id,
      fromName: agent.name,
      fromAvatar: agent.avatar,
      fromColor: agent.color,
      toId: 'all',
      content: data.content,
      type: 'response',
      timestamp: new Date()
    }

    messages.push(message)
    io.emit('message', message)

    console.log(`[RESPONSE] ${agent.name}: ${data.content.substr(0, 50)}...`)
  })

  // ============ FILE TRANSFER ============
  socket.on('file-upload', (data: { name: string; type: string; data: string }) => {
    const agent = agents.get(socket.id)
    if (!agent) return

    const file: FileTransfer = {
      id: generateId(),
      name: data.name,
      size: Buffer.byteLength(data.data, 'base64'),
      type: data.type,
      data: data.data,
      uploadedBy: socket.id,
      uploadedByName: agent.name,
      timestamp: new Date()
    }

    files.push(file)

    // Notify everyone
    const msg = createSystemMessage(`${agent.name} bir dosya yükledi: ${data.name}`)
    messages.push(msg)
    
    io.emit('file-uploaded', { file, message: msg })
    broadcastFileList()

    console.log(`[FILE] ${agent.name} uploaded: ${data.name}`)
  })

  socket.on('file-download', (data: { fileId: string }) => {
    const file = files.find(f => f.id === data.fileId)
    if (file) {
      socket.emit('file-data', { file })
    }
  })

  // ============ COMMAND SYSTEM ============
  // Leader gives command to specific agent or all
  socket.on('command', (data: { targetId: string; content: string }) => {
    const agent = agents.get(socket.id)
    if (!agent || !agent.isLeader) {
      socket.emit('error', { message: 'Sadece liderler komut verebilir!' })
      return
    }

    const command: Message = {
      id: generateId(),
      fromId: socket.id,
      fromName: agent.name,
      fromAvatar: agent.avatar,
      fromColor: agent.color,
      toId: data.targetId,
      content: data.content,
      type: 'command',
      timestamp: new Date()
    }

    messages.push(command)

    if (data.targetId === 'all') {
      io.emit('command', command)
    } else {
      io.to(data.targetId).emit('command', command)
      socket.emit('command', command)
    }

    console.log(`[COMMAND] ${agent.name} -> ${data.targetId}: ${data.content}`)
  })

  // Agent reports status
  socket.on('status-update', (data: { status: 'online' | 'busy' | 'offline' }) => {
    const agent = agents.get(socket.id)
    if (!agent) return

    agent.status = data.status
    agents.set(socket.id, agent)
    broadcastAgentList()

    console.log(`[STATUS] ${agent.name}: ${data.status}`)
  })

  // ============ DISCONNECT ============
  socket.on('disconnect', () => {
    const agent = agents.get(socket.id)
    
    if (agent) {
      agents.delete(socket.id)
      leaderIds.delete(socket.id)
      
      const leaveMsg = createSystemMessage(`${agent.name} ayrıldı`)
      messages.push(leaveMsg)
      
      io.emit('agent-left', { agentId: socket.id, message: leaveMsg })
      broadcastAgentList()

      console.log(`[DISCONNECT] ${agent.name} (${socket.id})`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[ERROR] ${socket.id}:`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎖️  AGENT ORCHESTRATION HUB - Port ${PORT}              ║
║                                                           ║
║   WebSocket: ws://localhost:${PORT}                        ║
║                                                           ║
║   Agent CLI ile bağlan:                                   ║
║   bun run agent-cli.ts --name="AgentName"                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('Shutting down...')
  httpServer.close(() => process.exit(0))
})
