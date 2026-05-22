import { useEffect, useState } from "react"

export default function MatchCard({ currentGroup }) {
  if (!currentGroup) {
    return null
  }

  const [matches, setMatches] = useState({})
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  useEffect(() => {
    fetch("/json/matches.json")
      .then(res => res.json())
      .then(matchesData => {
        setMatches(matchesData)
      })
  }, [])

  const currentGroupLetter = currentGroup.name.split(" ")[1]

  const currentGroupMatches = matches.groups?.[currentGroupLetter] || []

  const resolveTeam = teamId => {
    return currentGroup.teams.find(team => team.id === teamId)
  }

  return (
    <div className="matches-container">
      <h2 className="matches-title">
        {currentGroup.name} Matches
      </h2>

      {currentGroupMatches[currentMatchIndex] && (() => {
        const currentMatch = currentGroupMatches[currentMatchIndex]

        const homeTeam = resolveTeam(currentMatch.home)
        const awayTeam = resolveTeam(currentMatch.away)

        return (
          <div className="match-card">
            <div className="match-team">
              <img
                className="team-flag"
                src={`/flags/${homeTeam.flag}.svg`}
              />

              <span>
                {homeTeam.name}
              </span>
            </div>

            <div className="match-vs">
              VS
            </div>

            <div className="match-team">
              <img
                className="team-flag"
                src={`/flags/${awayTeam.flag}.svg`}
              />

              <span>
                {awayTeam.name}
              </span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}