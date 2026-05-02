function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

function normalize(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
}

const SYNONYMS = {
  'sleeping': 'sleep', 'slept': 'sleep',
  'ate': 'eating', 'eaten': 'eating',
  'drank': 'drinking', 'drunk': 'drinking',
  'worked': 'working', 'works': 'working',
  'watched': 'watching', 'watches': 'watching',
  'tv': 'watch tv', 'television': 'watch tv',
  'dreamt': 'dreaming', 'dreamed': 'dreaming',
  'read': 'reading',
  'rested': 'resting',
  'played': 'playing', 'plays': 'playing',
  'partied': 'partying',
  'drove': 'driving',
  'cooked': 'cooking',
  'sex': 'having sex', 'intercourse': 'having sex', 'make love': 'having sex',
  'phone': 'phone', 'mobile': 'phone', 'smartphone': 'phone', 'cell phone': 'phone',
  'internet': 'browsing', 'browse': 'browsing', 'surfing': 'browsing',
  'gym': 'exercise', 'workout': 'exercise', 'exercising': 'exercise',
  'jogged': 'jogging', 'jog': 'jogging', 'ran': 'running', 'run': 'running',
  'swam': 'swimming', 'swim': 'swimming',
}

function canonicalize(str) {
  const n = normalize(str)
  return SYNONYMS[n] || n
}

const THRESHOLD = 0.75

export function groupAnswers(answers) {
  const canonicals = answers.map(a => ({
    playerId: a.playerId,
    original: a.answer,
    canonical: canonicalize(a.answer),
  }))

  const groups = []
  for (const item of canonicals) {
    let matched = false
    for (const group of groups) {
      if (similarity(item.canonical, group.representative) >= THRESHOLD) {
        group.members.push(item)
        matched = true
        break
      }
    }
    if (!matched) groups.push({ representative: item.canonical, members: [item] })
  }

  groups.sort((a, b) => b.members.length - a.members.length)
  return groups.map(g => ({ canonical: g.representative, members: g.members, count: g.members.length }))
}

export function scoreRound(groups) {
  const scores = {}
  if (groups.length === 0) return scores
  const winnerCount = groups[0].count
  for (const group of groups) {
    const pts = group.count === winnerCount ? 10 : 0
    for (const member of group.members) scores[member.playerId] = pts
  }
  return scores
}
