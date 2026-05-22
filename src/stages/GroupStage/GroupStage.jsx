import { useEffect, useState } from "react"
import MatchCard from "./MatchCard"

export default function GroupStage() {
  const [groups, setGroups] = useState({})
  const [activeGroup, setActiveGroup] = useState(0)

  useEffect(() => {
    fetch("/json/groups.json")
      .then(res => res.json())
      .then(groupsData => {
        setGroups(groupsData)
      })
  }, [])

  const currentGroup = groups.groups?.[activeGroup]

  return (
    
    <div className="groups-container">
    <h1>Group Stage </h1>
      {currentGroup && (
        <div className="group-card">

          <h1 className="group-title">
            {currentGroup.name}
          </h1>

          <div className="group-teams">
            {currentGroup.teams.map(team => (
              <div className="team-row" key={team.id}>

                <div className="team-info">
                  <img
                    className="team-flag"
                    src={`/flags/${team.flag}.svg`}
                  />

                  <span className="team-name">
                    {team.name}
                  </span>
                </div>

                <div className="team-stats">
                  <span>W: {team.wins || 0}</span>
                  <span>D: {team.draws || 0}</span>
                  <span>L: {team.losses || 0}</span>
                  <span>PTS: {team.points || 0}</span>
                  <span>GD: {team.goalDiff || 0}</span>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    <MatchCard currentGroup={currentGroup}/>
    </div>
  )
}