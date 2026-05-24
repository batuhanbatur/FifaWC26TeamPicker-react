import { useEffect, useMemo, useState } from "react"
import MatchCard from "./MatchCard"
import { POINTS } from "../../../constants/points"
import { flagUrl } from "../../utils/flagUrl"

const MATCHES_PER_GROUP = 6

function initStats(groups) {
  const stats = {}
  groups.forEach(g =>
    g.teams.forEach(t => {
      stats[t.id] = { points: 0, goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0 }
    })
  )
  return stats
}

function sortTeams(teams, stats) {
  return [...teams]
    .map(t => ({ ...t, ...stats[t.id] }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdDiff = (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
      if (gdDiff !== 0) return gdDiff
      return b.goalsFor - a.goalsFor
    })
}

export default function GroupStage({ onComplete }) {
  const [groups, setGroups] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [teamStats, setTeamStats] = useState({})
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [viewGroupIndex, setViewGroupIndex] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}json/groups.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}json/matches.json`).then(r => r.json()),
    ]).then(([groupsData, matchesData]) => {
      const g = groupsData.groups
      const flat = g.flatMap(group => {
        const letter = group.name.split(" ")[1]
        return matchesData.groups[letter] || []
      })
      setGroups(g)
      setAllMatches(flat)
      setTeamStats(initStats(g))
    })
  }, [])

  const teamById = useMemo(() => {
    const map = {}
    groups.forEach(g => g.teams.forEach(t => { map[t.id] = t }))
    return map
  }, [groups])

  const activeGroupIndex = Math.floor(currentMatchIndex / MATCHES_PER_GROUP)
  const currentMatch = allMatches[currentMatchIndex]
  const homeTeam = currentMatch ? teamById[currentMatch.home] : null
  const awayTeam = currentMatch ? teamById[currentMatch.away] : null

  const viewGroup = groups[viewGroupIndex]
  const standings = useMemo(
    () => viewGroup ? sortTeams(viewGroup.teams, teamStats) : [],
    [viewGroup, teamStats]
  )

  const matchLabel = currentMatch
    ? `${groups[activeGroupIndex]?.name} | Match ${(currentMatchIndex % MATCHES_PER_GROUP) + 1} / ${MATCHES_PER_GROUP}`
    : ""

  const handleScoreSubmit = (homeGoals, awayGoals) => {
    const match = allMatches[currentMatchIndex]
    const hg = parseInt(homeGoals)
    const ag = parseInt(awayGoals)

    const newStats = { ...teamStats }
    const home = { ...newStats[match.home] }
    const away = { ...newStats[match.away] }

    home.goalsFor += hg
    home.goalsAgainst += ag
    away.goalsFor += ag
    away.goalsAgainst += hg

    if (hg > ag) {
      home.wins++; home.points += POINTS.MATCH_WIN; away.losses++
    } else if (hg < ag) {
      away.wins++; away.points += POINTS.MATCH_WIN; home.losses++
    } else {
      home.draws++; home.points += POINTS.MATCH_DRAW
      away.draws++; away.points += POINTS.MATCH_DRAW
    }

    newStats[match.home] = home
    newStats[match.away] = away
    setTeamStats(newStats)

    const nextIndex = currentMatchIndex + 1

    if (nextIndex % MATCHES_PER_GROUP === 0 && nextIndex < allMatches.length) {
      setViewGroupIndex(Math.floor(nextIndex / MATCHES_PER_GROUP))
    }

    if (nextIndex === allMatches.length) {
      const groupResults = groups.map(group => {
        const sorted = sortTeams(group.teams, newStats)
        const letter = group.name.split(" ")[1]
        return {
          groupName: group.name,
          winner: sorted[0],
          runnerUp: sorted[1],
          third: { ...sorted[2], groupLetter: letter },
          fourth: sorted[3],
        }
      })

      const allThirds = groupResults
        .map(g => g.third)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          const gdDiff = (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
          if (gdDiff !== 0) return gdDiff
          return b.goalsFor - a.goalsFor
        })

      onComplete(groupResults, allThirds.slice(0, 8))
    } else {
      setCurrentMatchIndex(nextIndex)
    }
  }

  if (!groups.length) return <div className="loading">Loading...</div>

  return (
    <div className="group-stage-layout">
      <aside className="group-sidebar">
        {groups.map((group, i) => {
          const isDone = i < activeGroupIndex
          const isActive = i === activeGroupIndex
          const isViewing = i === viewGroupIndex
          return (
            <button
              key={group.name}
              className={[
                "group-btn",
                isViewing ? "group-btn--viewing" : "",
                isActive ? "group-btn--active" : "",
                isDone ? "group-btn--done" : "",
              ].join(" ")}
              onClick={() => setViewGroupIndex(i)}
            >
              {group.name}
              {isDone && <span className="tick">✓</span>}
            </button>
          )
        })}
      </aside>

      <div className="group-main">
        <div className="standings-card">
          <h3 className="standings-title">{viewGroup?.name}</h3>
          {standings.map((team, i) => (
            <div key={team.id} className="team-row">
              <div className="team-info">
                <span className="team-pos">{i + 1}</span>
                <img className="team-flag" src={flagUrl(team.flag)} alt={team.name} />
                <span className="team-name">{team.name}</span>
              </div>
              <div className="team-stats">
                <span>W: {team.wins}</span>
                <span>D: {team.draws}</span>
                <span>L: {team.losses}</span>
                <span>GD: {team.goalsFor - team.goalsAgainst >= 0 ? "+" : ""}{team.goalsFor - team.goalsAgainst}</span>
                <span className="pts">PTS: {team.points}</span>
              </div>
            </div>
          ))}
        </div>

        {currentMatch && homeTeam && awayTeam && (
          <MatchCard
            key={currentMatch.id}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            matchLabel={matchLabel}
            onScoreSubmit={handleScoreSubmit}
          />
        )}
      </div>
    </div>
  )
}
