import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createGame, computeRound, leaderboard, STATES } from './game.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const questions = JSON.parse(readFileSync(join(__dirname, 'questions.json'), 'utf8'))

const PORT = process.env.PORT || 3456

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(express.static(join(__dirname, 'public')))

let game = createGame(questions)
let roundTimer = null

function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function clearRoundTimer() {
  if (roundTimer) { clearTimeout(roundTimer); roundTimer = null }
}

function broadcastLeaderboard(final = false) {
  const board = leaderboard(game)
  if (final) {
    game.state = STATES.FINISH
    io.to(game.room).emit('game:status', { name: 'FINISH', data: { leaderboard: board } })
  } else {
    game.state = STATES.LEADERBOARD
    io.to(game.room).emit('game:status', { name: 'LEADERBOARD', data: { leaderboard: board } })
  }
}

function revealRound() {
  clearRoundTimer()
  if (game.state !== STATES.QUESTION) return
  const result = computeRound(game)
  game.state = STATES.REVEALING
  io.to(game.room).emit('game:status', {
    name: 'REVEALING',
    data: {
      question: result.question.question,
      groups: result.groups.map(g => ({
        canonical: g.canonical,
        count: g.count,
        members: g.members.map(m => ({ playerId: m.playerId, original: m.original })),
        isWinner: g.count === result.groups[0].count,
      })),
      scores: result.scores,
      players: game.players,
    }
  })
}

function startQuestion() {
  if (!game.questions[game.currentQuestion]) {
    broadcastLeaderboard(true)
    return
  }
  game.answers = []
  game.state = STATES.QUESTION
  const q = game.questions[game.currentQuestion]
  io.to(game.room).emit('game:status', {
    name: 'QUESTION',
    data: {
      question: q.question,
      time: q.time,
      questionIndex: game.currentQuestion,
      total: game.questions.length,
    }
  })
  roundTimer = setTimeout(() => revealRound(), (q.time * 1000) + 2000)
}

io.on('connection', (socket) => {
  console.log(`+ connected ${socket.id}`)

  // ── MANAGER ──────────────────────────────────────────────────────────────

  socket.on('manager:createRoom', () => {
    if (game.manager) {
      socket.emit('game:error', 'A room is already active')
      return
    }
    game.room = generateRoomId()
    game.manager = socket.id
    socket.join(game.room)
    socket.emit('manager:roomCreated', { room: game.room })
    console.log(`Room created: ${game.room}`)
  })

  socket.on('manager:startGame', () => {
    if (socket.id !== game.manager) return
    if (game.started) { socket.emit('game:error', 'Game already started'); return }
    if (game.players.length === 0) { socket.emit('game:error', 'No players have joined yet'); return }
    game.started = true
    game.currentQuestion = 0
    io.to(game.room).emit('game:status', { name: 'STARTING', data: { countdown: 3 } })
    setTimeout(() => startQuestion(), 3000)
  })

  socket.on('manager:nextQuestion', () => {
    if (socket.id !== game.manager) return
    if (game.state !== STATES.REVEALING && game.state !== STATES.LEADERBOARD) return
    game.currentQuestion++
    startQuestion()
  })

  socket.on('manager:showLeaderboard', () => {
    if (socket.id !== game.manager) return
    if (game.state !== STATES.REVEALING) return
    broadcastLeaderboard(false)
  })

  socket.on('manager:kickPlayer', (playerId) => {
    if (socket.id !== game.manager) return
    const player = game.players.find(p => p.id === playerId)
    if (!player) return
    game.players = game.players.filter(p => p.id !== playerId)
    io.to(playerId).emit('game:kicked')
    io.in(playerId).socketsLeave(game.room)
    io.to(game.manager).emit('manager:playerList', game.players)
  })

  socket.on('manager:forceReveal', () => {
    if (socket.id !== game.manager) return
    if (game.state === STATES.QUESTION) revealRound()
  })

  socket.on('manager:resetGame', () => {
    if (socket.id !== game.manager) return
    clearRoundTimer()
    io.to(game.room).emit('game:reset')
    game = createGame(questions)
    console.log('Game reset')
  })

  // ── PLAYER ───────────────────────────────────────────────────────────────

  socket.on('player:checkRoom', (roomId) => {
    if (!game.room || game.room !== roomId) {
      socket.emit('game:error', 'Room not found')
      return
    }
    if (game.started) {
      socket.emit('game:error', 'Game already started')
      return
    }
    socket.emit('game:roomOk', roomId)
  })

  socket.on('player:join', ({ username, room }) => {
    const name = (username || '').trim().slice(0, 20)
    if (!name) { socket.emit('game:error', 'Name cannot be empty'); return }
    if (!game.room || game.room !== room) { socket.emit('game:error', 'Room not found'); return }
    if (game.started) { socket.emit('game:error', 'Game already started'); return }
    if (game.players.find(p => p.username.toLowerCase() === name.toLowerCase())) {
      socket.emit('game:error', 'That name is already taken')
      return
    }
    const player = { id: socket.id, username: name, points: 0 }
    game.players.push(player)
    socket.join(room)
    socket.emit('game:joined', { username: name })
    io.to(game.manager).emit('manager:playerList', game.players)
    console.log(`Player joined: ${name}`)
  })

  socket.on('player:answer', (answer) => {
    if (game.state !== STATES.QUESTION) return
    const player = game.players.find(p => p.id === socket.id)
    if (!player) return
    if (game.answers.find(a => a.playerId === socket.id)) return
    const text = (typeof answer === 'string' ? answer : '').trim().slice(0, 100)
    if (!text) return
    game.answers.push({ playerId: socket.id, answer: text })
    socket.emit('game:answerReceived')
    io.to(game.manager).emit('manager:answeredCount', {
      answered: game.answers.length,
      total: game.players.length,
    })
    if (game.answers.length === game.players.length) {
      setTimeout(() => revealRound(), 800)
    }
  })

  // ── DISCONNECT ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`- disconnected ${socket.id}`)
    if (socket.id === game.manager) {
      clearRoundTimer()
      io.to(game.room).emit('game:reset')
      game = createGame(questions)
      return
    }
    const player = game.players.find(p => p.id === socket.id)
    if (player) {
      game.players = game.players.filter(p => p.id !== socket.id)
      game.answers = game.answers.filter(a => a.playerId !== socket.id)
      if (game.manager) io.to(game.manager).emit('manager:playerList', game.players)
      if (
        game.state === STATES.QUESTION &&
        game.players.length > 0 &&
        game.answers.length === game.players.length
      ) setTimeout(() => revealRound(), 800)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`\n🎮  Feudle  →  http://localhost:${PORT}`)
  console.log(`    Manager  →  http://localhost:${PORT}/manager.html\n`)
})
