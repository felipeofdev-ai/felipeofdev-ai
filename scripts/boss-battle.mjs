#!/usr/bin/env node
/**
 * SNES Boss Battle — GitHub Issue turn-based game for profile README.
 * Triggered by .github/workflows/boss-battle.yml on issue_comment / issues.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATE_DIR = join(ROOT, '.github', 'boss-state');
const README_PATH = join(ROOT, 'README.md');
const SCORES_PATH = join(ROOT, 'data', 'boss-high-scores.json');

const BOSSES = [
  { name: 'Legacy Monolith', emoji: '🏰', maxHp: 120 },
  { name: 'Flaky CI Hydra', emoji: '🐍', maxHp: 100 },
  { name: 'Scope Creep Dragon', emoji: '🐉', maxHp: 140 },
  { name: 'Incident Kraken', emoji: '🦑', maxHp: 110 },
];

const MARKERS = {
  arena: ['<!-- BATTLE-ARENA-START -->', '<!-- BATTLE-ARENA-END -->'],
  scores: ['<!-- BOSS-HIGHSCORES-START -->', '<!-- BOSS-HIGHSCORES-END -->'],
};

function bar(current, max, width = 20) {
  const filled = Math.max(0, Math.min(width, Math.round((current / max) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function saveJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function statePath(issueNumber) {
  return join(STATE_DIR, `${issueNumber}.json`);
}

function loadState(issueNumber) {
  return loadJson(statePath(issueNumber), null);
}

function saveState(issueNumber, state) {
  saveJson(statePath(issueNumber), state);
}

function replaceSection(content, markers, replacement) {
  const [start, end] = markers;
  const re = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!re.test(content)) {
    throw new Error(`Markers not found: ${start}`);
  }
  return content.replace(re, `${start}\n${replacement}\n${end}`);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderArena(scores) {
  const boss = BOSSES[0];
  const lines = [
    '```text',
    '╔══════════════════════════════════════════════════════════════╗',
    '║           ⚔  README BOSS RAID — TURN-BASED RPG  ⚔           ║',
    '╠══════════════════════════════════════════════════════════════╣',
    `║  World Boss: ${boss.emoji} ${boss.name.padEnd(42)} ║`,
    '║  "Every merged PR weakens the monolith. Your move, knight."   ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '```',
    '',
    '| Command | Action | EN | PT |',
    '|---------|--------|----|----|',
    '| `/attack` | ⚔ Strike | Deal 12–28 dmg | Golpe |',
    '| `/defend` | 🛡 Guard | −50% incoming dmg | Defender |',
    '| `/special` | ✨ Code Review | Heavy hit · high risk | Revisão |',
    '| `/heal` | ☕ Coffee Break | +18 HP · boss strikes | Café |',
    '',
    '**▶ [START BOSS BATTLE](https://github.com/felipeofdev-ai/felipeofdev-ai/issues/new?template=boss-battle.yml)** · comment your move on the issue',
    '',
    `📊 **Raids logged:** ${scores.totalBattles} · **Victories:** ${scores.totalVictories}`,
    '',
    '> Full chiptune adventure → [SNES Quest](https://felipeofdev-ai.github.io/snes-quest.html) · original art · not Nintendo IP',
  ];
  return lines.join('\n');
}

function renderHighScores(scores) {
  const rows = scores.scores.slice(0, 10);
  if (rows.length === 0) {
    return [
      '| Rank | Knight | Boss | Turns | Score |',
      '|------|--------|------|-------|-------|',
      '| — | *Be the first victor* | — | — | — |',
      '',
      '_Defeat a boss in a [Boss Battle issue](https://github.com/felipeofdev-ai/felipeofdev-ai/issues/new?template=boss-battle.yml) to claim the arcade._',
    ].join('\n');
  }

  const table = [
    '| Rank | Knight | Boss | Turns | Score |',
    '|------|--------|------|-------|-------|',
    ...rows.map((r, i) =>
      `| ${i + 1} | [@${r.player}](https://github.com/${r.player}) | ${r.boss} | ${r.turns} | **${r.score}** |`,
    ),
  ];
  return table.join('\n');
}

function updateReadme(scores) {
  let readme = readFileSync(README_PATH, 'utf8');
  readme = replaceSection(readme, MARKERS.arena, renderArena(scores));
  readme = replaceSection(readme, MARKERS.scores, renderHighScores(scores));
  writeFileSync(README_PATH, readme, 'utf8');
}

function initBattle(issueNumber, playerLogin) {
  const boss = BOSSES[rand(0, BOSSES.length - 1)];
  const state = {
    issueNumber,
    player: playerLogin,
    boss: boss.name,
    bossEmoji: boss.emoji,
    playerHp: 100,
    playerMaxHp: 100,
    bossHp: boss.maxHp,
    bossMaxHp: boss.maxHp,
    turn: 1,
    score: 0,
    status: 'active',
    log: [`Battle started vs ${boss.emoji} **${boss.name}** (HP ${boss.maxHp}).`],
  };
  saveState(issueNumber, state);

  const scores = loadJson(SCORES_PATH, { scores: [], totalBattles: 0, totalVictories: 0 });
  scores.totalBattles += 1;
  scores.lastUpdated = new Date().toISOString();
  saveJson(SCORES_PATH, scores);
  updateReadme(scores);

  return {
    body: [
      `## ⚔ Boss Battle #${issueNumber}`,
      '',
      `**Knight:** @${playerLogin} · **Boss:** ${boss.emoji} ${boss.name}`,
      '',
      '```text',
      `YOU  HP ${bar(100, 100)} 100/100`,
      `BOSS HP ${bar(boss.maxHp, boss.maxHp)} ${boss.maxHp}/${boss.maxHp}`,
      '```',
      '',
      'Comment **`/attack`** · **`/defend`** · **`/special`** · **`/heal`** · **`/flee`**',
      '',
      '_EN: Turn-based SNES-style raid. PT: Comente o comando — Actions atualizam o placar no README._',
    ].join('\n'),
    state,
  };
}

function parseCommand(body) {
  const text = body.trim().toLowerCase();
  if (/^\/(attack|atacar)\b/.test(text)) return 'attack';
  if (/^\/(defend|defender)\b/.test(text)) return 'defend';
  if (/^\/(special|review|revisao|revisão)\b/.test(text)) return 'special';
  if (/^\/(heal|coffee|cafe|café)\b/.test(text)) return 'heal';
  if (/^\/(flee|fugir|run)\b/.test(text)) return 'flee';
  return null;
}

function bossStrike(state, multiplier = 1) {
  const base = rand(8, 18);
  const dmg = Math.max(1, Math.round(base * multiplier));
  state.playerHp = Math.max(0, state.playerHp - dmg);
  state.log.push(`Boss hits for **${dmg}** damage.`);
  return dmg;
}

function processTurn(state, command) {
  if (state.status !== 'active') {
    return `Battle already **${state.status}**. Open a [new raid](https://github.com/felipeofdev-ai/felipeofdev-ai/issues/new?template=boss-battle.yml).`;
  }

  let playerAction = '';

  switch (command) {
    case 'attack': {
      const dmg = rand(12, 28);
      state.bossHp = Math.max(0, state.bossHp - dmg);
      state.score += dmg;
      playerAction = `You strike for **${dmg}** damage.`;
      bossStrike(state);
      break;
    }
    case 'defend': {
      const dmg = rand(5, 12);
      state.bossHp = Math.max(0, state.bossHp - dmg);
      state.score += dmg;
      playerAction = `Guarded strike for **${dmg}** damage.`;
      bossStrike(state, 0.5);
      break;
    }
    case 'special': {
      const dmg = rand(28, 42);
      state.bossHp = Math.max(0, state.bossHp - dmg);
      state.score += dmg * 2;
      playerAction = `✨ Code Review lands **${dmg}** damage!`;
      bossStrike(state, 1.3);
      break;
    }
    case 'heal': {
      const heal = rand(14, 22);
      state.playerHp = Math.min(state.playerMaxHp, state.playerHp + heal);
      playerAction = `☕ Coffee restores **${heal}** HP.`;
      bossStrike(state);
      break;
    }
    case 'flee': {
      state.status = 'fled';
      state.log.push('You fled the battle.');
      return formatResult(state, '🏃 You fled! Score not recorded.');
    }
    default:
      return 'Unknown command. Use `/attack`, `/defend`, `/special`, `/heal`, or `/flee`.';
  }

  state.turn += 1;
  state.log.push(playerAction);

  if (state.bossHp <= 0) {
    state.status = 'won';
    const bonus = state.playerHp * 2;
    state.score += bonus;
    recordVictory(state);
    return formatResult(state, `🏆 **VICTORY!** Boss defeated in ${state.turn} turns. Score: **${state.score}**`);
  }

  if (state.playerHp <= 0) {
    state.status = 'lost';
    state.log.push('You were defeated.');
    return formatResult(state, '💀 **GAME OVER** — the boss wins this round. Insert coin and try again!');
  }

  return formatResult(state, `Turn **${state.turn}** — choose your next move.`);
}

function recordVictory(state) {
  const scores = loadJson(SCORES_PATH, { scores: [], totalBattles: 0, totalVictories: 0 });
  scores.totalVictories += 1;
  scores.lastUpdated = new Date().toISOString();
  scores.scores.push({
    player: state.player,
    boss: state.boss,
    turns: state.turn,
    score: state.score,
    date: new Date().toISOString().slice(0, 10),
  });
  scores.scores.sort((a, b) => b.score - a.score);
  scores.scores = scores.scores.slice(0, 25);
  saveJson(SCORES_PATH, scores);
  updateReadme(scores);
}

function formatResult(state, headline) {
  return [
    headline,
    '',
    `**Knight @${state.player}** vs ${state.bossEmoji} **${state.boss}** · Turn ${state.turn} · Score ${state.score}`,
    '',
    '```text',
    `YOU  HP ${bar(state.playerHp, state.playerMaxHp)} ${state.playerHp}/${state.playerMaxHp}`,
    `BOSS HP ${bar(state.bossHp, state.bossMaxHp)} ${state.bossHp}/${state.bossMaxHp}`,
    '```',
    '',
    ...state.log.slice(-4).map((l) => `- ${l}`),
    '',
    state.status === 'active'
      ? 'Next: **`/attack`** · **`/defend`** · **`/special`** · **`/heal`** · **`/flee`**'
      : '[▶ New Boss Battle](https://github.com/felipeofdev-ai/felipeofdev-ai/issues/new?template=boss-battle.yml)',
  ].join('\n');
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.log('No GITHUB_EVENT_PATH — regenerating README sections from scores.');
    const scores = loadJson(SCORES_PATH, { scores: [], totalBattles: 0, totalVictories: 0 });
    updateReadme(scores);
    return;
  }

  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  mkdirSync(STATE_DIR, { recursive: true });

  if (event.issue && event.action === 'opened') {
    const labels = (event.issue.labels ?? []).map((l) => l.name);
    if (!labels.includes('boss-battle')) return;

    const player = event.issue.user?.login ?? 'guest';
    const { body } = initBattle(event.issue.number, player);
    console.log(JSON.stringify({ comment: body }));
    return;
  }

  if (event.comment && event.issue) {
    const labels = (event.issue.labels ?? []).map((l) => l.name);
    if (!labels.includes('boss-battle')) return;
    if (event.comment.user?.type === 'Bot') return;

    const command = parseCommand(event.comment.body ?? '');
    if (!command) return;

    let state = loadState(event.issue.number);
    if (!state) {
      const player = event.comment.user?.login ?? 'guest';
      initBattle(event.issue.number, player);
      state = loadState(event.issue.number);
    }

    const reply = processTurn(state, command);
    saveState(event.issue.number, state);
    console.log(JSON.stringify({ comment: reply }));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
