import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import './App.css'
import './visuals/visuals.css'

type Chapter = {
  id: string
  title: string
  type: 'markdown' | 'drill'
  file?: string
  drillId?: string
}

type DrillQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

type DrillData = {
  title: string
  intro: string
  questions: DrillQuestion[]
}

const drillBank: Record<string, DrillData> = {
  d1: {
    title: 'RFI Drill',
    intro:
      'Standard scenario drill: choose the best raise-first-in hand for each position.',
    questions: [
      {
        id: 'd1-q1',
        prompt:
          'You are UTG in a 9-handed game. Which hand is the best standard open? ',
        choices: ['KJo', 'A9o', '77', 'Q9s'],
        correctIndex: 2,
        explanation:
          'UTG ranges are tight. Pocket pairs like 77 are in; offsuit broadways like KJo/A9o are too loose.',
      },
      {
        id: 'd1-q2',
        prompt:
          'You are on the Button. Which hand is a clear open-raise?',
        choices: ['T7o', 'A2s', '95o', 'K2o'],
        correctIndex: 1,
        explanation:
          'The Button opens much wider. A2s plays well with position and suitedness.',
      },
      {
        id: 'd1-q3',
        prompt:
          'You are in the Cutoff. What is the best open?',
        choices: ['A5s', 'J8o', '64s', 'Q6o'],
        correctIndex: 0,
        explanation:
          'A5s is a strong semi-bluff candidate with good playability in late position.',
      },
      {
        id: 'd1-q4',
        prompt:
          'You are in the Small Blind, folded to you. What is the best option?',
        choices: ['Complete with 86s', 'Open-raise with ATo', 'Fold K9s', 'Limp with QTs'],
        correctIndex: 1,
        explanation:
          'When folded to in the SB, you can open-raise a wide range. ATo is a clear raise.',
      },
    ],
  },
  d2: {
    title: '3-Bet Defense Drill',
    intro:
      'Standard scenario drill: defend versus opens and 3-bets with the best default action.',
    questions: [
      {
        id: 'd2-q1',
        prompt:
          'You are in the Hijack. UTG opens 2.5bb. You have AQs. What is the best default?',
        choices: ['Call', '3-bet', 'Fold', 'Jam'],
        correctIndex: 1,
        explanation:
          'AQs plays well as a 3-bet versus an UTG open in most games.',
      },
      {
        id: 'd2-q2',
        prompt:
          'You are in the Big Blind. Button opens 2.5bb. You hold JTs. Best option?',
        choices: ['Call', 'Fold', '3-bet', 'Jam'],
        correctIndex: 0,
        explanation:
          'JTs is a strong defend vs late-position opens; calling keeps dominated hands in.',
      },
      {
        id: 'd2-q3',
        prompt:
          'You are on the Button. Cutoff opens 2.5bb. You have KQo. Best default?',
        choices: ['Fold', 'Call', '3-bet', 'Jam'],
        correctIndex: 2,
        explanation:
          'KQo is strong enough to 3-bet in position versus a CO open.',
      },
      {
        id: 'd2-q4',
        prompt:
          'You are in the Small Blind. Button opens 2.5bb. You have 99. Best option?',
        choices: ['Call', '3-bet', 'Fold', 'Jam'],
        correctIndex: 1,
        explanation:
          'In the SB you are out of position. 99 is strong enough to 3-bet for value.',
      },
    ],
  },
  d3: {
    title: '4-Bet Pot Drill',
    intro:
      'Timed speed drill: answer quickly in 60 seconds for 4-bet pot decisions.',
    questions: [
      {
        id: 'd3-q1',
        prompt:
          'You 3-bet from the Button with AJs. The Cutoff 4-bets small. Best default?',
        choices: ['Fold', 'Call', '5-bet jam', 'Min-raise'],
        correctIndex: 1,
        explanation:
          'AJs can call small 4-bets in position depending on sizing; it plays well postflop.',
      },
      {
        id: 'd3-q2',
        prompt:
          'You 3-bet from the SB with QQ vs Button open. Button 4-bets. Best action?',
        choices: ['Fold', 'Call', '5-bet jam', 'Min-raise'],
        correctIndex: 2,
        explanation:
          'QQ is a premium; out of position you usually go for the 5-bet jam/stack off.',
      },
      {
        id: 'd3-q3',
        prompt:
          'You open CO with 98s. Button 3-bets large. Best default?',
        choices: ['Fold', 'Call', '4-bet bluff', 'Jam'],
        correctIndex: 0,
        explanation:
          'Large 3-bets reduce implied odds. 98s is too weak to continue versus big sizing.',
      },
      {
        id: 'd3-q4',
        prompt:
          'You open UTG with AKs. Button 3-bets. Best default?',
        choices: ['Call', 'Fold', '4-bet for value', 'Jam only'],
        correctIndex: 2,
        explanation:
          'AKs is a clear 4-bet value hand.',
      },
    ],
  },
  d4: {
    title: 'Final Assessment',
    intro:
      'Pass-band assessment: score at least 70% to pass and complete the course.',
    questions: [
      {
        id: 'd4-q1',
        prompt:
          'Standard cash game open sizing in most positions is:',
        choices: ['2–2.5bb', '4–5bb', '6–7bb', '1bb'],
        correctIndex: 0,
        explanation:
          'Modern ranges favor 2–2.5bb opens for better risk/reward.',
      },
      {
        id: 'd4-q2',
        prompt:
          'Which hand is usually a 3-bet bluff candidate from the Button vs CO?',
        choices: ['A5s', 'K9o', 'J2o', '76o'],
        correctIndex: 0,
        explanation:
          'A5s blocks strong hands and has playability, making it a common bluff 3-bet.',
      },
      {
        id: 'd4-q3',
        prompt:
          'When in the Big Blind vs Button open, you should defend:',
        choices: ['Very tight', 'Very wide', 'Only premium hands', 'Only suited aces'],
        correctIndex: 1,
        explanation:
          'You have great pot odds; BB defense is typically wide versus Button opens.',
      },
      {
        id: 'd4-q4',
        prompt:
          'A solid 4-bet value range usually starts around:',
        choices: ['A2s', 'TT+', '22+', 'KTo'],
        correctIndex: 1,
        explanation:
          'Most 4-bet value ranges start around TT+/AQ+/AK depending on positions.',
      },
    ],
  },
}

const quizBank: Record<string, DrillData> = {
  A1: {
    title: 'Chapter Quiz: RFI Fundamentals',
    intro:
      'Scenario check: nail the core RFI ideas before moving on.',
    questions: [
      {
        id: 'a1-q1',
        prompt: 'What does RFI mean in preflop poker?',
        choices: [
          'Raise for information',
          'Raise first in',
          'Re-raise from inside',
          'Range first in',
        ],
        correctIndex: 1,
        explanation: 'RFI stands for “raise first in.”',
      },
      {
        id: 'a1-q2',
        prompt: 'Which position should generally use the tightest opening range?',
        choices: ['Button', 'Cutoff', 'Under the gun', 'Small blind'],
        correctIndex: 2,
        explanation: 'UTG is first to act and therefore must open the tightest.',
      },
      {
        id: 'a1-q3',
        prompt: 'Why can players open a wider range from late position?',
        choices: [
          'Because blinds are larger',
          'They act later postflop and realize equity better',
          'Because the cards are stronger on the button',
          'Because it guarantees folds',
        ],
        correctIndex: 1,
        explanation: 'Late position acts last postflop, so more hands can realize equity.',
      },
      {
        id: 'a1-q4',
        prompt: 'What is a strong default lesson takeaway for RFI sizing?',
        choices: [
          'Use a consistent default size',
          'Size larger with strong hands',
          'Change size by position only',
          'Always min-raise',
        ],
        correctIndex: 0,
        explanation: 'Consistent sizing protects your range and reduces tells.',
      },
    ],
  },
  A2: {
    title: 'Chapter Quiz: 3-Bet Strategy',
    intro:
      'Scenario check: test your 3-bet logic and motivation.',
    questions: [
      {
        id: 'a2-q1',
        prompt: 'What is a 3-bet preflop?',
        choices: [
          'A limp after a raise',
          'A call of a 3-bet',
          'A re-raise versus an open raise',
          'An all-in overcall',
        ],
        correctIndex: 2,
        explanation: 'A 3-bet is the first re-raise after an open.',
      },
      {
        id: 'a2-q2',
        prompt: 'Which pair best describes the two main reasons to 3-bet?',
        choices: [
          'Fold equity and boredom',
          'Value and bluff/semi-bluff pressure',
          'Pot odds and position',
          'Tilt and timing tells',
        ],
        correctIndex: 1,
        explanation: 'You 3-bet for value or to apply bluff/semi-bluff pressure.',
      },
      {
        id: 'a2-q3',
        prompt: "What's the primary motivation for 3-betting for value?",
        choices: [
          'To get called by worse hands',
          'To avoid a flop',
          'To balance bluffs',
          'To win blinds only',
        ],
        correctIndex: 0,
        explanation: 'Value 3-bets aim to get action from worse hands.',
      },
      {
        id: 'a2-q4',
        prompt: 'When 3-betting as a bluff, what should be true?',
        choices: [
          'The opponent never folds',
          'You are always out of position',
          'Your hand is the nuts',
          'The opponent should have a high fold percentage',
        ],
        correctIndex: 3,
        explanation: 'Bluff 3-bets rely on folds often enough to be profitable.',
      },
    ],
  },
  A3: {
    title: 'Chapter Quiz: Facing a 3-Bet',
    intro:
      'Scenario check: confirm your response when pressure comes back at you.',
    questions: [
      {
        id: 'a3-q1',
        prompt: 'What does "facing a 3-bet" mean?',
        choices: [
          'You 3-bet someone',
          'You limped and got raised',
          'You are facing a re-raise after you opened',
          'You are in the big blind',
        ],
        correctIndex: 2,
        explanation: 'Facing a 3-bet means your open has been re-raised.',
      },
      {
        id: 'a3-q2',
        prompt: 'When calling a 3-bet, what position advantage becomes less important?',
        choices: [
          'Initiative always matters more',
          'Position matters less when deeper',
          'Pot odds always shrink',
          'Stack depth is irrelevant',
        ],
        correctIndex: 1,
        explanation: 'The lesson takeaway: deeper stacks reduce the positional edge when calling.',
      },
      {
        id: 'a3-q3',
        prompt: 'What is a common mistake when facing 3-bets?',
        choices: ['Only 4-betting', 'Over-folding premium hands', 'Calling too wide', 'Never folding'],
        correctIndex: 2,
        explanation: 'Calling too wide leaks chips against strong 3-bet ranges.',
      },
      {
        id: 'a3-q4',
        prompt: 'What is the "4-bet or fold" strategy?',
        choices: [
          'Either 4-bet or fold, rarely call',
          'Always flat call',
          'Only 4-bet premiums',
          'Only fold in position',
        ],
        correctIndex: 0,
        explanation: 'This strategy avoids thin calls by choosing 4-bet or fold.',
      },
    ],
  },
  A4: {
    title: 'Chapter Quiz: 4-Bet and Beyond',
    intro:
      'Scenario check: test your 4-bet definitions and stack-depth logic.',
    questions: [
      {
        id: 'a4-q1',
        prompt: 'What is a 4-bet?',
        choices: [
          'The first raise',
          'A call after a 3-bet',
          'A check-raise postflop',
          'A re-raise after a 3-bet',
        ],
        correctIndex: 3,
        explanation: 'A 4-bet is the re-raise that follows a 3-bet.',
      },
      {
        id: 'a4-q2',
        prompt: 'When do you typically 4-bet for value?',
        choices: [
          'When stacks are tiny',
          'When you have a premium hand',
          'When you want to see a flop',
          'When you are tilting',
        ],
        correctIndex: 1,
        explanation: 'Value 4-bets come from premium hands that want action.',
      },
      {
        id: 'a4-q3',
        prompt: "What's the \"4-bet bluff\" range?", 
        choices: [
          'Hands strong enough to bluff but not call',
          'Only the very top of range',
          'Any two cards',
          'Hands you always fold',
        ],
        correctIndex: 0,
        explanation: '4-bet bluffs are strong blockers that can’t profitably call.',
      },
      {
        id: 'a4-q4',
        prompt: 'How does stack depth affect 4-bet strategy?',
        choices: [
          'Shallow stacks favor more calling',
          'Depth makes no difference',
          'Deeper stacks favor more calling',
          'Deeper stacks mean only jams',
        ],
        correctIndex: 2,
        explanation: 'Deeper stacks increase postflop options, so calls appear more.',
      },
    ],
  },
  A5: {
    title: 'Chapter Quiz: Play Against Opens',
    intro:
      'Scenario check: confirm your response to opens and isolation spots.',
    questions: [
      {
        id: 'a5-q1',
        prompt: 'What is "playing against an open"?',
        choices: [
          'Opening the pot yourself',
          'Acting after someone has opened',
          'Only limping behind',
          'Checking from the big blind',
        ],
        correctIndex: 1,
        explanation: 'It means you are responding after another player opens.',
      },
      {
        id: 'a5-q2',
        prompt: 'Which position has the weakest range to open?',
        choices: ['Button', 'Cutoff', 'Under the gun', 'Small blind'],
        correctIndex: 2,
        explanation: 'The lesson answer here: UTG is the weakest opening range.',
      },
      {
        id: 'a5-q3',
        prompt: 'What is "isolation"?',
        choices: [
          'Limping behind',
          'Flat calling to see a flop',
          'Raising to play heads-up with a weaker opponent',
          'Checking to trap',
        ],
        correctIndex: 2,
        explanation: 'Isolation raises target a weaker player and cut out callers.',
      },
      {
        id: 'a5-q4',
        prompt: 'When should you defend your big blind?',
        choices: [
          'When the opener is out of position',
          'Only with premium hands',
          'Never versus late position',
          'Only when short stacked',
        ],
        correctIndex: 0,
        explanation: 'Defend when the opener is out of position to you.',
      },
    ],
  },
  A6: {
    title: 'Chapter Quiz: Short Stack Play',
    intro:
      'Scenario check: verify short-stack thresholds and push/fold rules.',
    questions: [
      {
        id: 'a6-q1',
        prompt: 'At what stack depth is a player considered "short stacked"?',
        choices: ['Under 20 big blinds', 'Under 50 big blinds', 'Under 100 big blinds', 'Over 150 big blinds'],
        correctIndex: 1,
        explanation: 'This course defines short stacks as under 50bb.',
      },
      {
        id: 'a6-q2',
        prompt: 'What is push-or-fold?',
        choices: ['Either go all-in or fold', 'Always limp', 'Call then shove later', 'Only min-raise'],
        correctIndex: 0,
        explanation: 'Push-or-fold means your only options are all-in or fold.',
      },
      {
        id: 'a6-q3',
        prompt: 'What is an "open push"?',
        choices: [
          'Limping in',
          'Going all-in instead of min-raising',
          'Calling a raise',
          'Check-raising',
        ],
        correctIndex: 1,
        explanation: 'An open push is an all-in open instead of a small raise.',
      },
      {
        id: 'a6-q4',
        prompt: 'Why do short stacks open with tighter ranges?',
        choices: [
          'To look tough',
          'Because they see more flops',
          'To ensure they have enough equity',
          'Because position never matters',
        ],
        correctIndex: 2,
        explanation: 'With fewer chips, you need stronger equity to commit.',
      },
    ],
  },
  A7: {
    title: 'Chapter Quiz: Tournament Dynamics',
    intro:
      'Scenario check: confirm tournament-only concepts like ICM and bubble play.',
    questions: [
      {
        id: 'a7-q1',
        prompt: 'How do tournament dynamics differ from cash games?',
        choices: [
          'Stacks are always infinite',
          'Rake is higher',
          'Hands are dealt face-up',
          'Blinds increase over time',
        ],
        correctIndex: 3,
        explanation: 'Tournament blinds rise, which changes stack pressure over time.',
      },
      {
        id: 'a7-q2',
        prompt: 'What is "ICM" in tournaments?',
        choices: [
          'Instant Chip Multiplier',
          'Independent Cash Method',
          'Independent Chip Model - valuing chips by tournament equity',
          'In-game Card Management',
        ],
        correctIndex: 2,
        explanation: 'ICM converts chip stacks into tournament equity value.',
      },
      {
        id: 'a7-q3',
        prompt: 'When should you play more conservatively in a tournament?',
        choices: ['Near the bubble', 'Early levels', 'Always on the button', 'After winning a pot'],
        correctIndex: 0,
        explanation: 'Near the bubble, survival and equity preservation matter more.',
      },
      {
        id: 'a7-q4',
        prompt: 'What is a "bubble" in a tournament?',
        choices: [
          'A table break',
          'The pay jump just before making the money',
          'The final table',
          'A rebuy period',
        ],
        correctIndex: 1,
        explanation: 'The bubble is the last elimination before payouts begin.',
      },
    ],
  },
}


const chapters: Chapter[] = [
  { id: 'A1', title: 'RFI Fundamentals', type: 'markdown', file: 'A1.md' },
  {
    id: 'A2',
    title: 'Opening Ranges and Position',
    type: 'markdown',
    file: 'A2.md',
  },
  {
    id: 'A3',
    title: 'Three-Betting and Facing Pressure',
    type: 'markdown',
    file: 'A3.md',
  },
  { id: 'A4', title: '4-Bet and Beyond', type: 'markdown', file: 'A4.md' },
  { id: 'A5', title: 'Play Against Opens', type: 'markdown', file: 'A5.md' },
  { id: 'A6', title: 'Short Stack Play', type: 'markdown', file: 'A6.md' },
  { id: 'A7', title: 'Tournament Dynamics', type: 'markdown', file: 'A7.md' },
  { id: 'D1', title: 'RFI Drill', type: 'drill', drillId: 'd1' },
  { id: 'D2', title: '3-Bet Defense Drill', type: 'drill', drillId: 'd2' },
  { id: 'D3', title: '4-Bet Pot Drill', type: 'drill', drillId: 'd3' },
  { id: 'D4', title: 'Final Assessment', type: 'drill', drillId: 'd4' },
]

const drillStorageKey = 'course-1-preflop-drills'
const quizStorageKey = 'course-1-preflop-chapter-quizzes'
const progressStorageKey = 'course-1-preflop-progress'

type QuestionProgress = {
  answers: Record<string, number>
  submitted?: boolean
  lastUpdated: string
}

type QuestionStore = Record<string, QuestionProgress>

type ProgressEntry = {
  score: number
  total: number
  submitted: boolean
  completed?: boolean
  lastUpdated: string
}

type ProgressStore = {
  quizzes: Record<string, ProgressEntry>
  drills: Record<string, ProgressEntry>
}

type ProgressSnapshot = {
  completed: number
  total: number
}

const getProgressSnapshot = (total: number): ProgressSnapshot => {
  if (typeof window === 'undefined') {
    return { completed: 0, total }
  }

  const stored = localStorage.getItem(progressStorageKey)
  if (!stored) return { completed: 0, total }

  try {
    const parsed = JSON.parse(stored) as ProgressStore
    const quizCompleted = Object.values(parsed.quizzes || {}).filter(
      (entry) => entry.completed ?? entry.submitted
    ).length
    const drillCompleted = Object.values(parsed.drills || {}).filter(
      (entry) => entry.submitted
    ).length
    const completed = Math.min(total, quizCompleted + drillCompleted)
    return { completed, total }
  } catch {
    return { completed: 0, total }
  }
}

type QuestionSetProps = {
  data: DrillData
  setId: string
  storageKey: string
  resetLabel: string
  summaryTitle: string | ((score: number, total: number) => string)
  summaryNote: string | ((score: number, total: number) => string)
  requireSubmit?: boolean
  submitLabel?: string
  timedSeconds?: number
  passThreshold?: number
  progressType?: 'quiz' | 'drill'
}

const saveProgress = ({
  kind,
  id,
  score,
  total,
  submitted,
  completed,
}: {
  kind: 'quiz' | 'drill'
  id: string
  score: number
  total: number
  submitted: boolean
  completed?: boolean
}) => {
  const stored = localStorage.getItem(progressStorageKey)
  let parsed: ProgressStore = { quizzes: {}, drills: {} }
  if (stored) {
    try {
      parsed = JSON.parse(stored) as ProgressStore
    } catch {
      parsed = { quizzes: {}, drills: {} }
    }
  }
  const entry: ProgressEntry = {
    score,
    total,
    submitted,
    completed,
    lastUpdated: new Date().toISOString(),
  }
  const next: ProgressStore = {
    quizzes: {
      ...parsed.quizzes,
      ...(kind === 'quiz' ? { [id]: entry } : {}),
    },
    drills: {
      ...parsed.drills,
      ...(kind === 'drill' ? { [id]: entry } : {}),
    },
  }
  localStorage.setItem(progressStorageKey, JSON.stringify(next))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('course-progress-update'))
  }
}

function QuestionSet({
  data,
  setId,
  storageKey,
  resetLabel,
  summaryTitle,
  summaryNote,
  requireSubmit,
  submitLabel,
  timedSeconds,
  passThreshold,
  progressType,
}: QuestionSetProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timedSeconds ?? 0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    setHydrated(false)
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      setAnswers({})
      setSubmitted(false)
      setTimedOut(false)
      setTimeLeft(timedSeconds ?? 0)
      setHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(stored) as QuestionStore
      const entry = parsed[setId]
      const nextAnswers = entry?.answers ?? {}
      const nextSubmitted = entry?.submitted ?? false
      setAnswers(nextAnswers)
      setSubmitted(nextSubmitted)
      setTimedOut(false)
      setTimeLeft(nextSubmitted ? 0 : timedSeconds ?? 0)
    } catch {
      setAnswers({})
      setSubmitted(false)
      setTimedOut(false)
      setTimeLeft(timedSeconds ?? 0)
    } finally {
      setHydrated(true)
    }
  }, [setId, storageKey])

  useEffect(() => {
    if (!hydrated) return
    const stored = localStorage.getItem(storageKey)
    let parsed: QuestionStore = {}
    if (stored) {
      try {
        parsed = JSON.parse(stored) as QuestionStore
      } catch {
        parsed = {}
      }
    }
    const next: QuestionStore = {
      ...parsed,
      [setId]: {
        answers,
        submitted,
        lastUpdated: new Date().toISOString(),
      },
    }
    localStorage.setItem(storageKey, JSON.stringify(next))
  }, [answers, submitted, setId, storageKey, hydrated])

  const score = data.questions.reduce((total, q) => {
    if (answers[q.id] === q.correctIndex) return total + 1
    return total
  }, 0)

  const answeredCount = data.questions.filter(
    (q) => answers[q.id] !== undefined
  ).length

  const canSubmit = answeredCount === data.questions.length
  const passed = passThreshold
    ? score / data.questions.length >= passThreshold
    : true

  useEffect(() => {
    if (!hydrated) return
    if (!progressType) return
    const isFinal = requireSubmit ? submitted : canSubmit
    if (!isFinal) return
    saveProgress({
      kind: progressType,
      id: setId,
      score,
      total: data.questions.length,
      submitted: isFinal,
      completed: progressType === 'quiz' ? isFinal : undefined,
    })
  }, [
    hydrated,
    progressType,
    requireSubmit,
    submitted,
    canSubmit,
    score,
    data.questions.length,
    setId,
  ])

  useEffect(() => {
    if (!timedSeconds) return
    if (!hydrated) return
    if (submitted) return
    if (timedOut) return

    setTimeLeft((prev) => (prev > 0 ? prev : timedSeconds))

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          setTimedOut(true)
          setSubmitted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timedSeconds, hydrated, submitted, timedOut])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isLocked = requireSubmit && submitted

  const resolvedSummaryTitle =
    typeof summaryTitle === 'function'
      ? summaryTitle(score, data.questions.length)
      : summaryTitle

  const resolvedSummaryNote =
    typeof summaryNote === 'function'
      ? summaryNote(score, data.questions.length)
      : summaryNote

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setTimedOut(false)
    setTimeLeft(timedSeconds ?? 0)
  }

  return (
    <section className="drill">
      <div className="drill-card">
        <h2>{data.title}</h2>
        <p className="drill-intro">{data.intro}</p>
        <div className="drill-meta">
          <div className="drill-score">
            Score: <strong>{score}</strong> / {data.questions.length}
          </div>
          <div className="drill-score">
            Answered: <strong>{answeredCount}</strong> / {data.questions.length}
          </div>
          {timedSeconds ? (
            <div className={`drill-timer ${timedOut ? 'expired' : ''}`}>
              {timedOut ? 'Time expired' : 'Time left'}:{' '}
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          ) : null}
          <button className="drill-reset" onClick={handleReset}>
            {resetLabel}
          </button>
        </div>
      </div>

      <div className="drill-questions">
        {data.questions.map((q, idx) => {
          const selected = answers[q.id]
          const isCorrect = selected === q.correctIndex
          const isAnswered = selected !== undefined
          const status = isAnswered ? (isCorrect ? 'green' : 'red') : 'yellow'

          return (
            <div key={q.id} className="question-card">
              <div className="question-header">
                <span className={`stoplight ${status}`} />
                <div className="question-title">
                  Q{idx + 1}. {q.prompt}
                </div>
              </div>
              <div className="question-choices">
                {q.choices.map((choice, choiceIndex) => {
                  const isSelected = selected === choiceIndex
                  const isChoiceCorrect = choiceIndex === q.correctIndex
                  const choiceClass = isAnswered
                    ? isSelected
                      ? isChoiceCorrect
                        ? 'choice correct'
                        : 'choice incorrect'
                      : isChoiceCorrect
                        ? 'choice correct'
                        : 'choice'
                    : isSelected
                      ? 'choice selected'
                      : 'choice'

                  return (
                    <button
                      key={choice}
                      className={choiceClass}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: choiceIndex,
                        }))
                      }
                      disabled={isLocked}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
              {isAnswered && (
                <div className={`feedback ${isCorrect ? 'good' : 'bad'}`}>
                  {isCorrect ? 'Correct.' : 'Not quite.'} {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {requireSubmit && !submitted && (
        <div className="drill-submit">
          <button
            className="drill-submit-btn"
            onClick={() => setSubmitted(true)}
            disabled={!canSubmit}
          >
            {submitLabel ?? 'Submit'}
          </button>
          {!canSubmit ? (
            <p className="drill-submit-note">Answer all questions to submit.</p>
          ) : null}
          {timedSeconds ? (
            <p className="drill-submit-note">
              Timer ends the drill automatically.
            </p>
          ) : null}
        </div>
      )}

      {((requireSubmit && submitted) || (!requireSubmit && canSubmit)) && (
        <div className="drill-summary">
          <h3>{resolvedSummaryTitle}</h3>
          <p>
            You finished {data.title}. Final score:{' '}
            <strong>
              {score} / {data.questions.length}
            </strong>
            .
          </p>
          {passThreshold ? (
            <p className="drill-summary-note">
              {passed
                ? `Pass. You cleared ${(passThreshold * 100).toFixed(0)}% and unlocked the completion badge.`
                : `Not quite. You need ${(passThreshold * 100).toFixed(0)}% to pass. Reset and try again.`}
            </p>
          ) : resolvedSummaryNote ? (
            <p className="drill-summary-note">{resolvedSummaryNote}</p>
          ) : null}
        </div>
      )}
    </section>
  )
}

function Drill({ drillId }: { drillId: string }) {
  const drill = drillBank[drillId]
  const timedSeconds = drillId === 'd3' ? 60 : undefined
  const passThreshold = drillId === 'd4' ? 0.7 : undefined
  const requireSubmit = drillId === 'd3' || drillId === 'd4'

  const summaryTitle = drillId === 'd4' ? 'Final Assessment Summary' : 'Drill Summary'
  const summaryNote =
    drillId === 'd4'
      ? 'Score 70% or better to pass. Reset to re-attempt.'
      : 'Green lights = nailed it. Red lights = review that spot. Yellow lights mean unanswered.'

  return (
    <QuestionSet
      data={drill}
      setId={drillId}
      storageKey={drillStorageKey}
      resetLabel="Reset Drill"
      summaryTitle={summaryTitle}
      summaryNote={summaryNote}
      requireSubmit={requireSubmit}
      submitLabel={drillId === 'd3' ? 'Lock In Answers' : 'Submit Assessment'}
      timedSeconds={timedSeconds}
      passThreshold={passThreshold}
      progressType="drill"
    />
  )
}

function Quiz({ quizId }: { quizId: string }) {
  const quiz = quizBank[quizId]
  if (!quiz) return null
  const getQuizSummaryTitle = (score: number, total: number) => {
    if (score === total) {
      return "Perfect Score! You've mastered this chapter's fundamentals. Well done!"
    }
    if (score === total - 1) {
      return "Great work! You're almost there. Review the one you missed and you'll have it locked down."
    }
    if (score === Math.ceil(total / 2)) {
      return "Good effort! Time to review the chapter and try again. You've got this!"
    }
    if (score === 1) {
      return "Keep studying! Review the chapter content and try again. Every attempt makes you stronger."
    }
    return "Don't give up! This is how we learn. Go back to the chapter, review the basics, and come back refreshed."
  }

  return (
    <QuestionSet
      data={quiz}
      setId={quizId}
      storageKey={quizStorageKey}
      resetLabel="Reset Quiz"
      summaryTitle={getQuizSummaryTitle}
      summaryNote=""
      requireSubmit
      submitLabel="Submit Quiz"
      progressType="quiz"
    />
  )
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contentHtml, setContentHtml] = useState('<p>Loading…</p>')
  const totalUnits = chapters.length
  const [progressSnapshot, setProgressSnapshot] = useState(() =>
    getProgressSnapshot(totalUnits)
  )
  const progressPercent = totalUnits
    ? Math.round((progressSnapshot.completed / totalUnits) * 100)
    : 0

  const current = useMemo(() => chapters[currentIndex], [currentIndex])

  useEffect(() => {
    const updateProgress = () => {
      setProgressSnapshot(getProgressSnapshot(totalUnits))
    }
    updateProgress()
    window.addEventListener('storage', updateProgress)
    window.addEventListener('course-progress-update', updateProgress)
    return () => {
      window.removeEventListener('storage', updateProgress)
      window.removeEventListener('course-progress-update', updateProgress)
    }
  }, [totalUnits])

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase()
      if (!hash) return
      const idx = chapters.findIndex((chapter) => chapter.id === hash)
      if (idx >= 0) setCurrentIndex(idx)
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // UX: when switching sections, always start at the top.
  // Note: browsers may try to keep the focused "Next" button in view, which can
  // re-scroll you to the bottom. We blur focus and scroll after paint.
  useEffect(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    scrollTop()
    requestAnimationFrame(scrollTop)
    setTimeout(scrollTop, 0)
  }, [currentIndex])

  useEffect(() => {
    if (current.type !== 'markdown') return
    let isMounted = true
    const load = async () => {
      try {
        const base = import.meta.env.BASE_URL ?? '/'
        // Avoid stale markdown after deploy (GitHub Pages can be aggressively cached)
        const v = import.meta.env.VITE_BUILD_ID
        const qs = v ? `?v=${encodeURIComponent(String(v))}` : ''
        const res = await fetch(`${base}course-md/${current.file}${qs}`, {
          cache: 'no-store',
        })
        let text = await res.text()
        // Safety: strip internal chapter codes from markdown headings if any slip through
        // Examples: "# A1 — Title" / "## D3 — Drill" etc.
        text = text.replace(/^(#{1,6})\s*[A-D]\d+\s*[—-]\s*/gim, '$1 ')
        let html = (await marked.parse(text)) as string
        // GitHub Pages base-path fix: markdown often references /course-md/... (root),
        // but this site is hosted under /course-1-preflop-site/. Rewrite to include BASE_URL.
        html = html.replaceAll('src="/course-md/', `src="${base}course-md/`)
        if (isMounted) setContentHtml(html)
      } catch {
        if (isMounted)
          setContentHtml(
            '<p>Failed to load chapter. Check the markdown path.</p>'
          )
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [current])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img
            className="brand-icon"
            src={`${import.meta.env.BASE_URL}course-assets/cards-icon.svg`}
            alt="Poker cards icon"
          />
          <div className="brand-copy">
            <div className="brand-kicker">PlayPokerWinMoney</div>
            <div className="brand-title">Course 1 — Preflop</div>
            <div className="brand-sub">Chapters + Drills</div>
          </div>
        </div>
        <nav className="nav">
          {chapters.map((chapter, idx) => (
            <button
              key={chapter.id}
              className={`nav-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <span className="nav-id">{chapter.id}</span>
              <span className="nav-title">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <div className="scoreboard">
            <div className="scoreboard-copy">
              <div className="scoreboard-kicker">Scoreboard</div>
              <div className="scoreboard-title">Midnight Fuel Gauge</div>
              <div className="scoreboard-sub">Track every chapter and drill.</div>
            </div>
            <div className="fuel-gauge" role="progressbar" aria-valuenow={progressSnapshot.completed} aria-valuemin={0} aria-valuemax={progressSnapshot.total}>
              <div className="fuel-gauge-track">
                <div
                  className="fuel-gauge-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="fuel-gauge-stats">
                <span className="fuel-gauge-count">
                  {progressSnapshot.completed}/{progressSnapshot.total}
                </span>
                <span className="fuel-gauge-label">Chapters Cleared</span>
                <span className="fuel-gauge-percent">{progressPercent}%</span>
              </div>
            </div>
          </div>
          <div className="content-hero">
            <div className="content-hero-copy">
              <span className="content-pill seal-badge">
                {current.type === 'markdown' ? 'Lesson' : 'Drill'}
              </span>
              <h1>{current.title}</h1>
              <p className="content-summary">
                Tight ranges, clean pressure, fewer spews. Learn the spots that
                actually move your preflop win rate.
              </p>
              <div className="chip-set">
                <span className="chip">Midnight Academy</span>
                <span className="chip">Preflop Foundations</span>
                <span className="chip">30-Day Discipline</span>
              </div>
            </div>
            <img
              className="content-hero-art"
              src={`${import.meta.env.BASE_URL}course-assets/poker-hero.svg`}
              alt="Stylized poker table with chips and cards"
            />
          </div>
        </header>

        <section className="curriculum-timeline">
          <div className="timeline-title">Curriculum Path</div>
          <div className="timeline-items">
            {chapters
              .filter((chapter) => chapter.type === 'markdown')
              .map((chapter) => (
                <div key={chapter.id} className="timeline-item">
                  <div className="timeline-seal">{chapter.id}</div>
                  <div>
                    <div className="timeline-heading">{chapter.title}</div>
                    <div className="timeline-sub">Core lesson</div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {current.type === 'markdown' ? (
          <>
            <article
              className="markdown"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            <Quiz quizId={current.id} />
          </>
        ) : (
          <Drill drillId={current.drillId ?? 'd1'} />
        )}

        <div className="section-divider" aria-hidden="true">
          <img
            src={`${import.meta.env.BASE_URL}course-assets/table-divider.svg`}
            alt=""
          />
        </div>

        <div className="pager">
          <button
            className="pager-btn"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="pager-btn"
            onClick={() =>
              setCurrentIndex((i) => Math.min(chapters.length - 1, i + 1))
            }
            disabled={currentIndex === chapters.length - 1}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
