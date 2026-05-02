import { groupAnswers, scoreRound } from './similarity.js'

export const STATES = {
  LOBBY: 'LOBBY',
  QUESTION: 'QUESTION',
  REVEALING: 'REVEALING',
  LEADERBOARD: 'LEADERBOARD',
  FINISH: 'FINISH',
}

export function createGame(questions) {
  return {
    room: null,
    manager: null,
    players: [],
    answers: [],
    currentQuestion: 0,
    state: STATES.LOBBY,
    questions,
    started: false,
  }
}

export function computeRound(game) {
  const groups = groupAnswers(game.answers)
  const scores = scoreRound(groups)
  for (const player of game.players) {
    player.points += scores[player.id] || 0
  }
  return { groups, scores, question: game.questions[game.currentQuestion] }
}

export function leaderboard(game) {
  return [...game.players].sort((a, b) => b.points - a.points)
}
