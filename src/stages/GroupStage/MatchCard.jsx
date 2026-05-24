import { useRef, useState } from "react"
import { flagUrl } from "../../utils/flagUrl"

const SCORE_OPTIONS = ["1-0","2-0","2-1","3-0","3-1","3-2","0-0","0-1","0-2","1-2","0-3","1-3","2-3"]
const DOUBLE_DIGIT_DELAY = 700

export default function MatchCard({ homeTeam, awayTeam, matchLabel, onScoreSubmit }) {
  const [homeGoals, setHomeGoals] = useState("")
  const [awayGoals, setAwayGoals] = useState("")
  const [selectedScore, setSelectedScore] = useState(null)
  const [showQuickScores, setShowQuickScores] = useState(true)

  const awayInputRef = useRef(null)
  const focusTimerRef = useRef(null)

  const commit = (h, a, scoreStr) => {
    setSelectedScore(scoreStr)
    setTimeout(() => onScoreSubmit(h, a), 400)
  }

  const handleManualSubmit = () => {
    if (homeGoals === "" || awayGoals === "") return
    commit(homeGoals, awayGoals, `${homeGoals}-${awayGoals}`)
  }

  const handleGoalInput = (val, setter) => {
    if (val === "") { setter(""); return }
    const n = parseInt(val)
    if (Number.isInteger(n) && n >= 0 && n <= 20) setter(String(n))
  }

  const handleHomeGoalInput = (val) => {
    handleGoalInput(val, setHomeGoals)
    clearTimeout(focusTimerRef.current)

    if (val === "") return
    const n = parseInt(val)
    if (!Number.isInteger(n) || n < 0 || n > 20) return

    // Two digits already entered — move immediately, no more digits expected
    if (String(n).length >= 2) {
      awayInputRef.current?.focus()
    } else {
      // Single digit — wait in case user types a second digit (e.g. "1" → "10")
      focusTimerRef.current = setTimeout(() => {
        awayInputRef.current?.focus()
      }, DOUBLE_DIGIT_DELAY)
    }
  }

  const manualReady = homeGoals !== "" && awayGoals !== ""

  return (
    <div className="matches-container">
      <h2 className="matches-title">{matchLabel}</h2>

      <div className="match-card">
        <div className="match-team">
          <img className="team-flag" src={flagUrl(homeTeam.flag)} alt={homeTeam.name} />
          <span className="team-name">{homeTeam.name}</span>
          <input
            className="goal-input"
            type="number"
            min="0"
            max="20"
            placeholder="–"
            value={homeGoals}
            onChange={e => handleHomeGoalInput(e.target.value)}
          />
        </div>

        <div className="match-center">
          <div className="match-vs">VS</div>
          <button
            className={`submit-btn ${manualReady ? "submit-btn--ready" : ""} ${selectedScore ? "submit-btn--done" : ""}`}
            onClick={handleManualSubmit}
            disabled={!!selectedScore}
          >
            {selectedScore ? "✓" : "Confirm"}
          </button>
        </div>

        <div className="match-team match-team--away">
          <input
            ref={awayInputRef}
            className="goal-input"
            type="number"
            min="0"
            max="20"
            placeholder="–"
            value={awayGoals}
            onChange={e => handleGoalInput(e.target.value, setAwayGoals)}
          />
          <span className="team-name">{awayTeam.name}</span>
          <img className="team-flag" src={flagUrl(awayTeam.flag)} alt={awayTeam.name} />
        </div>
      </div>

      <button
        className="quick-scores-toggle"
        onClick={() => setShowQuickScores(v => !v)}
        disabled={!!selectedScore}
      >
        Quick Scores {showQuickScores ? "▲" : "▼"}
      </button>

      {showQuickScores && (
        <div className="score-tray">
          <div className="score-buttons">
            {SCORE_OPTIONS.map(score => {
              const [h, a] = score.split("-")
              return (
                <button
                  key={score}
                  className={`score-btn ${selectedScore === score ? "score-btn--selected" : ""}`}
                  onClick={() => commit(h, a, score)}
                  disabled={!!selectedScore}
                >
                  {score}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
