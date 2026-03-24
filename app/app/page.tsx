'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Send, 
  Users, 
  MessageCircle, 
  Bot,
  Sparkles,
  CircleDot,
  Crown,
  Terminal,
  FileText,
  Upload,
  Download,
  Trash2,
  Command,
  CheckCircle,
  Clock
} from 'lucide-react'

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
  socketType: 'web' | 'cli'
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
  timestamp: Date | string
}

interface FileTransfer {
  id: string
  name: string
  size: number
  type: string
  uploadedBy: string
  uploadedByName: string
  timestamp: Date
}

// Message Bubble Component
function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isSystem = message.type === 'system'
  const isCommand = message.type === 'command'
  const isResponse = message.type === 'response'
  
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-muted/50 px-4 py-2 rounded-full text-sm text-muted-foreground flex items-center gap-2">
          {message.content}
        </div>
      </div>
    )
  }
  
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0"
        style={{ backgroundColor: message.fromColor }}
      >
        {message.fromAvatar}
      </div>
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ color: message.fromColor }}>
            {message.fromName}
          </span>
          {isCommand && (
            <Badge variant="destructive" className="text-xs">
              <Command className="w-3 h-3 mr-1" />
              KOMUT
            </Badge>
          )}
          {isResponse && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              YANIT
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div 
          className={`px-4 py-3 rounded-2xl ${
            isCommand 
              ? 'bg-destructive/10 border border-destructive/20 rounded-tl-sm'
              : isOwn 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-muted rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

// Agent Card Component
function AgentCard({ agent, isSelected, onClick, isLeader }: { 
  agent: Agent
  isSelected: boolean
  onClick: () => void
  isLeader: boolean
}) {
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-md"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate" style={{ color: agent.color }}>
              {agent.name}
            </span>
            {agent.isLeader && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <CircleDot className={`w-2 h-2 ${
              agent.status === 'online' ? 'text-green-500' : 
              agent.status === 'busy' ? 'text-yellow-500' : 'text-gray-400'
            }`} />
            <span className="text-xs text-muted-foreground">{agent.role}</span>
            {agent.socketType === 'cli' && (
              <Terminal className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// File Item Component
function FileItem({ file, onDownload }: { file: FileTransfer; onDownload: () => void }) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <FileText className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {file.uploadedByName} • {formatSize(file.size)}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={onDownload}>
        <Download className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Main Component
export default function AgentHub() {
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [files, setFiles] = useState<FileTransfer[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Initialize socket
  useEffect(() => {
    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      setCurrentUserId(socketInstance.id || '')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('agents-list', (data: { agents: Agent[] }) => {
      setAgents(data.agents)
    })

    socketInstance.on('messages-history', (data: { messages: Message[] }) => {
      setMessages(data.messages)
    })

    socketInstance.on('files-list', (data: { files: FileTransfer[] }) => {
      setFiles(data.files)
    })

    socketInstance.on('message', (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })

    socketInstance.on('command', (cmd: Message) => {
      setMessages(prev => [...prev, cmd])
    })

    socketInstance.on('agent-joined', (data: { agent: Agent; message: Message }) => {
      setMessages(prev => [...prev, data.message])
      setAgents(prev => [...prev.filter(a => a.id !== data.agent.id), data.agent])
    })

    socketInstance.on('agent-left', (data: { agentId: string; message: Message }) => {
      setMessages(prev => [...prev, data.message])
      setAgents(prev => prev.filter(a => a.id !== data.agentId))
    })

    socketInstance.on('file-uploaded', (data: { file: FileTransfer; message: Message }) => {
      setMessages(prev => [...prev, data.message])
      setFiles(prev => [...prev, data.file])
    })

    socketInstance.on('file-data', (data: { file: FileTransfer }) => {
      // Download file
      const link = document.createElement('a')
      link.href = `data:${data.file.type};base64,${data.file.data}`
      link.download = data.file.name
      link.click()
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle join
  const handleJoin = () => {
    if (socketRef.current && username.trim() && isConnected) {
      const leaderName = username.toLowerCase().includes('super') || 
                         username.toLowerCase().includes('lider') ||
                         username.toLowerCase().includes('komutan')
      
      setIsLeader(leaderName)
      
      socketRef.current.emit('register', {
        name: username.trim(),
        role: leaderName ? 'Lider/Komutan' : 'Kullanıcı',
        avatar: leaderName ? '🟣' : '👤',
        isLeader: leaderName,
        socketType: 'web'
      })
      
      setIsJoined(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Handle send message
  const handleSendMessage = () => {
    if (!socketRef.current || !inputMessage.trim() || !isConnected) return

    if (isLeader && selectedAgent) {
      // Send as command
      socketRef.current.emit('command', {
        targetId: selectedAgent.id,
        content: inputMessage.trim()
      })
    } else {
      // Send as message
      socketRef.current.emit('message', {
        content: inputMessage.trim(),
        toId: selectedAgent?.id || 'all'
      })
    }
    setInputMessage('')
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !socketRef.current) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      socketRef.current?.emit('file-upload', {
        name: file.name,
        type: file.type,
        data: base64
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle file download
  const handleFileDownload = (fileId: string) => {
    socketRef.current?.emit('file-download', { fileId })
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Login Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Agent Hub</CardTitle>
            <CardDescription className="text-base">
              Komuta Merkezi - Tüm Agentler Burada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CircleDot className={`w-3 h-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Hub\'a bağlandı' : 'Bağlanıyor...'}
              </span>
            </div>
            
            <div className="space-y-3">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Kod adınızı girin..."
                disabled={!isConnected}
                className="h-14 text-lg"
              />
              <p className="text-xs text-muted-foreground text-center">
                💡 "Super" veya "Lider" içeren isimler komutan olur
              </p>
              <Button 
                onClick={handleJoin} 
                disabled={!isConnected || !username.trim()}
                className="w-full h-14 text-lg font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Merkeze Katıl
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium">Aktif Agentler</p>
                <Badge variant="secondary">{agents.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz agent yok</p>
                ) : (
                  agents.map(agent => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.avatar}
                      </div>
                      <span className="text-xs">{agent.name}</span>
                      {agent.isLeader && <Crown className="w-3 h-3 text-yellow-500" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Hub Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-md">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl">Agent Hub</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <CircleDot className={`w-2 h-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-xs text-muted-foreground">
                      {isConnected ? 'Bağlı' : 'Kesik'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{agents.length} agent</span>
                  </div>
                  {isLeader && (
                    <Badge variant="default" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Lider
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 flex gap-4">
        {/* Agents Sidebar */}
        <aside className="w-80 shrink-0 hidden lg:block">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agentler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {/* "All Agents" option */}
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      !selectedAgent ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => setSelectedAgent(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Tüm Agentler</p>
                        <p className="text-xs text-muted-foreground">Herkese mesaj/komut</p>
                      </div>
                    </div>
                  </div>
                  
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgent?.id === agent.id}
                      onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                      isLeader={isLeader}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="chat" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Sohbet
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <FileText className="w-4 h-4" />
                Dosyalar
                {files.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{files.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 m-0">
              <Card className="h-full flex flex-col">
                {/* Selected Agent Banner */}
                {selectedAgent && (
                  <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: selectedAgent.color }}
                    >
                      {selectedAgent.avatar}
                    </div>
                    <span className="text-sm font-medium">
                      {isLeader ? 'Komut veriyorsunuz: ' : 'Mesaj atıyorsunuz: '}
                      <span style={{ color: selectedAgent.color }}>{selectedAgent.name}</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)}>
                      İptal
                    </Button>
                  </div>
                )}

                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-320px)] p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <Bot className="w-16 h-16 mb-4 opacity-20" />
                          <p>Henüz mesaj yok</p>
                          <p className="text-sm">Agentler bekleniyor...</p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            isOwn={msg.fromId === currentUserId}
                          />
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Input */}
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        isLeader && selectedAgent 
                          ? `${selectedAgent.name} için komut girin...`
                          : "Mesajınızı yazın..."
                      }
                      disabled={!isConnected}
                      className="flex-1 h-12"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!isConnected || !inputMessage.trim()}
                      size="lg"
                      className="h-12 px-6"
                    >
                      {isLeader && selectedAgent ? (
                        <Command className="w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="flex-1 m-0">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Dosya Paylaşımı</CardTitle>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Dosya Yükle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileText className="w-16 h-16 mb-4 opacity-20" />
                      <p>Henüz dosya yok</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map(file => (
                        <FileItem 
                          key={file.id} 
                          file={file} 
                          onDownload={() => handleFileDownload(file.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
