import { useEffect, useMemo, useState } from "react"
import { stageOrder } from "../../../constants/stageOrder"
import { STAGE_LABELS } from "../../../constants/stageLabels"
import Bracket from "./Bracket"

function assignBestThirds(last32Matches, bestThirds) {
  const slots = []
  last32Matches.forEach(m => {
    if (m.home.type === "bestThird")
      slots.push({ key: `${m.id}_home`, validGroups: m.home.groups })
    if (m.away.type === "bestThird")
      slots.push({ key: `${m.id}_away`, validGroups: m.away.groups })
  })
  const assignment = {}
  const used = new Set()
  function backtrack(i) {
    if (i === slots.length) return true
    const slot = slots[i]
    for (const team of bestThirds) {
      if (used.has(team.id)) continue
      if (slot.validGroups.includes(team.groupLetter)) {
        assignment[slot.key] = team.name
        used.add(team.id)
        if (backtrack(i + 1)) return true
        delete assignment[slot.key]
        used.delete(team.id)
      }
    }
    return false
  }
  backtrack(0)
  return assignment
}

export default function KnockoutStages({ groupResults, bestThirds }) {
  const [knockoutData, setKnockoutData]       = useState(null)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [allResults, setAllResults]           = useState({})
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [champion, setChampion]               = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}json/knockout.json`).then(r => r.json()).then(setKnockoutData)
  }, [])

  const bestThirdAssignment = useMemo(() => {
    if (!knockoutData) return {}
    return assignBestThirds(knockoutData.stages.last32, bestThirds)
  }, [knockoutData, bestThirds])

  // Resolve every stage at once so the bracket can show all rounds.
  const allStageMatches = useMemo(() => {
    if (!knockoutData) return {}
    const resolve = (ref, matchId, side) => {
      if (ref.type === "winner")
        return groupResults.find(g => g.groupName === `Group ${ref.group}`).winner.name
      if (ref.type === "runnerUp")
        return groupResults.find(g => g.groupName === `Group ${ref.group}`).runnerUp.name
      if (ref.type === "bestThird")
        return bestThirdAssignment[`${matchId}_${side}`] ?? "TBD"
      if (ref.type === "winnerMatch")
        return allResults[ref.match] ?? "TBD"
    }
    const all = {}
    stageOrder.forEach(stage => {
      all[stage] = knockoutData.stages[stage].map(m => ({
        id: m.id,
        home: resolve(m.home, m.id, "home"),
        away: resolve(m.away, m.id, "away"),
      }))
    })
    return all
  }, [knockoutData, allResults, groupResults, bestThirdAssignment])

  // Flat lookup used by Bracket
  const resolvedMatchById = useMemo(() => {
    const map = {}
    Object.values(allStageMatches).flat().forEach(m => { map[m.id] = m })
    return map
  }, [allStageMatches])

  // Flag map: team name → flag code
  const teamFlagMap = useMemo(() => {
    const map = {}
    groupResults.forEach(g => {
      [g.winner, g.runnerUp, g.third].forEach(t => {
        if (t?.name && t?.flag) map[t.name] = t.flag
      })
    })
    return map
  }, [groupResults])

  const currentStageName  = stageOrder[currentStageIndex]
  const resolvedMatches   = allStageMatches[currentStageName] ?? []
  const currentMatch      = resolvedMatches[currentMatchIndex]
  const activeMatchId     = currentMatch?.id

  const handleWinner = (winner) => {
    const newResults = { ...allResults, [currentMatch.id]: winner }
    setAllResults(newResults)
    const next = currentMatchIndex + 1
    if (next >= resolvedMatches.length) {
      const nextStage = currentStageIndex + 1
      if (nextStage >= stageOrder.length) {
        setChampion(winner)
      } else {
        setCurrentStageIndex(nextStage)
        setCurrentMatchIndex(0)
      }
    } else {
      setCurrentMatchIndex(next)
    }
  }

  if (!knockoutData) return <div className="loading">Loading…</div>

  if (champion) {
    return (
      <div className="champion-screen">
        <div className="champion-trophy">🏆</div>
        <h2 className="champion-label">World Cup Winner</h2>
        <h1 className="champion-name">{champion}</h1>
      </div>
    )
  }

  const homeFlag = currentMatch ? teamFlagMap[currentMatch.home] : null
  const awayFlag = currentMatch ? teamFlagMap[currentMatch.away] : null

  return (
    <div className="knockout-container">
      <Bracket
        knockoutData={knockoutData}
        resolvedMatchById={resolvedMatchById}
        allResults={allResults}
        activeMatchId={activeMatchId}
        teamFlagMap={teamFlagMap}
      />

      {currentMatch && (
        <div className="match-picker">
          <p className="match-counter">
            {STAGE_LABELS[currentStageName]} | Match {currentMatchIndex + 1} / {resolvedMatches.length}
          </p>
          <div className="knockout-buttons">
            <button className="knockout-btn" onClick={() => handleWinner(currentMatch.home)}>
              {homeFlag && <img className="knockout-flag" src={`/flags/${homeFlag}.svg`} alt="" />}
              {currentMatch.home}
            </button>
            <span className="vs-label">vs</span>
            <button className="knockout-btn" onClick={() => handleWinner(currentMatch.away)}>
              {awayFlag && <img className="knockout-flag" src={`/flags/${awayFlag}.svg`} alt="" />}
              {currentMatch.away}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
