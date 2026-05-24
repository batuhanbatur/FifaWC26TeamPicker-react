import { useMemo } from "react"
import { STAGE_LABELS } from "../../../constants/stageLabels"
import { flagUrl } from "../../utils/flagUrl"

// DFS pre-order from the final match outward.
// Produces { id, depth } entries where depth 1=SF, 2=QF, 3=L16, 4=L32.
// Pre-order ensures top-to-bottom visual ordering within each depth.
function collectSide(ref, matchById, depth) {
  if (!ref || ref.type !== "winnerMatch") return []
  const match = matchById[ref.match]
  if (!match) return []
  return [
    { id: match.id, depth },
    ...collectSide(match.home, matchById, depth + 1),
    ...collectSide(match.away, matchById, depth + 1),
  ]
}

function buildBracketOrder(knockoutData) {
  const matchById = {}
  Object.values(knockoutData.stages).flat().forEach(m => { matchById[m.id] = m })

  const finalMatch = knockoutData.stages.final[0]

  const group = (entries) => {
    const map = {}
    entries.forEach(({ id, depth }) => {
      ;(map[depth] ??= []).push(id)
    })
    return map
  }

  return {
    left: group(collectSide(finalMatch.home, matchById, 1)),
    right: group(collectSide(finalMatch.away, matchById, 1)),
    finalId: finalMatch.id,
  }
}

const DEPTH_TO_STAGE = { 1: "semiFinals", 2: "quarterFinals", 3: "last16", 4: "last32" }

// Column descriptors: depth descending on left, ascending on right
const LEFT_DEPTHS  = [4, 3, 2, 1]
const RIGHT_DEPTHS = [1, 2, 3, 4]

export default function Bracket({ knockoutData, resolvedMatchById, allResults, activeMatchId, teamFlagMap }) {
  const order = useMemo(() => buildBracketOrder(knockoutData), [knockoutData])

  const col = (side, depth) => {
    const stage = DEPTH_TO_STAGE[depth]
    const ids = order[side][depth] ?? []
    return (
      <div key={`${side}-${depth}`} className="bc">
        <div className="bc-label">{STAGE_LABELS[stage]}</div>
        <div className="bc-matches">
          {ids.map(id => (
            <div key={id} className={`bc-slot bc-slot--d${depth}`}>
              <BracketMatch
                match={resolvedMatchById[id]}
                result={allResults[id]}
                isActive={id === activeMatchId}
                teamFlagMap={teamFlagMap}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const finalMatch = resolvedMatchById[order.finalId]

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {LEFT_DEPTHS.map(d => col("left", d))}

        {/* Final */}
        <div className="bc bc--final">
          <div className="bc-label">{STAGE_LABELS["final"]}</div>
          <div className="bc-matches">
            <div className="bc-slot bc-slot--final">
              {finalMatch && (
                <BracketMatch
                  match={finalMatch}
                  result={allResults[order.finalId]}
                  isActive={order.finalId === activeMatchId}
                  teamFlagMap={teamFlagMap}
                />
              )}
            </div>
          </div>
        </div>

        {RIGHT_DEPTHS.map(d => col("right", d))}
      </div>
    </div>
  )
}

function BracketMatch({ match, result, isActive, teamFlagMap }) {
  if (!match) return <div className="bm bm--tbd"><span>TBD</span></div>
  const isTBD = match.home === "TBD" && match.away === "TBD"
  const isDone = !!result
  return (
    <div className={[
      "bm",
      isActive  ? "bm--active" : "",
      isDone    ? "bm--done"   : "",
      isTBD     ? "bm--tbd"   : "",
    ].filter(Boolean).join(" ")}>
      <BracketTeam name={match.home} won={result === match.home} flagMap={teamFlagMap} />
      <BracketTeam name={match.away} won={result === match.away} flagMap={teamFlagMap} />
    </div>
  )
}

function BracketTeam({ name, won, flagMap }) {
  const flag = name && name !== "TBD" ? flagMap[name] : null
  return (
    <div className={`bm-team${won ? " bm-team--won" : ""}`}>
      {flag
        ? <img className="bm-flag" src={flagUrl(flag)} alt="" />
        : <span className="bm-flag-ph" />
      }
      <span className="bm-name">{name || "TBD"}</span>
    </div>
  )
}
