import { useState } from "react"
import GroupStage from "./stages/GroupStage/GroupStage"
import KnockoutStages from "./stages/KnockoutStages/KnockoutStages"
import "./style.css"

function App() {
  const [stage, setStage] = useState("group")
  const [groupResults, setGroupResults] = useState(null)
  const [bestThirds, setBestThirds] = useState(null)

  const handleGroupStageComplete = (results, thirds) => {
    setGroupResults(results)
    setBestThirds(thirds)
    setStage("knockout")
  }

  return (
    <div>
      <h1 className="app-title">FIFA World Cup 2026 Team Picker</h1>
      {stage === "group" && (
        <GroupStage onComplete={handleGroupStageComplete} />
      )}
      {stage === "knockout" && (
        <KnockoutStages groupResults={groupResults} bestThirds={bestThirds} />
      )}
    </div>
  )
}

export default App
