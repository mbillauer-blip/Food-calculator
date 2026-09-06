import { useState } from 'react'
import './App.css'

// ---------------------------------------------------------------------------
// Config: per-person baselines and unit-detection keywords, kept separate so
// the numbers are easy to tune without touching the calculation logic below.
// ---------------------------------------------------------------------------
const CONFIG = {
  kidFactor: 0.55,

  protein: {
    // Mains scale down as more sides/carbs join the table. First matching
    // maxCount wins, checked in ascending order.
    mainsGramsPerAdultByItemCount: [
      { maxCount: 1, grams: 200 },
      { maxCount: 3, grams: 150 },
      { maxCount: Infinity, grams: 115 },
    ],
    boneInMultiplier: 1.35,
    boneInKeywords: [
      'thigh', 'drumstick', 'wing', 'rib', 'bone-in', 'bone in',
      'whole chicken', 'whole turkey',
    ],
    // Premium/special-occasion cuts guests tend to go back for seconds on.
    specialMultiplier: 1.2,
    specialKeywords: [
      'lamb', 'beef', 'steak', 'prime rib', 'filet', 'tenderloin', 'brisket',
    ],
    // Lamb ribs are sold and cooked by the rack, not by loose weight.
    rack: {
      keywords: [
        'lamb rib', 'lamb ribs', 'lamb chop', 'lamb chops',
        'rack of lamb', 'lamb rack',
      ],
      ribsPerRack: 6,
      ribsPerAdultByItemCount: [
        { maxCount: 1, ribs: 5 },
        { maxCount: 3, ribs: 4 },
        { maxCount: Infinity, ribs: 3 },
      ],
    },
  },

  appetizers: {
    // Scales down as more appetizer varieties are added, same shape as mains.
    gramsPerAdultByItemCount: [
      { maxCount: 1, grams: 90 },
      { maxCount: 3, grams: 70 },
      { maxCount: Infinity, grams: 50 },
    ],
    // Guests graze on apps for hours before mains even arrive.
    lateNightMultiplier: 1.25,
  },

  sides: {
    gramsPerAdultByItemCount: [
      { maxCount: 2, grams: 100 },
      { maxCount: Infinity, grams: 85 },
    ],
    // Used when a side matches the unit-based keyword list below.
    unitsPerAdultByItemCount: [
      { maxCount: 2, units: 1.5 },
      { maxCount: Infinity, units: 1 },
    ],
  },

  carbs: {
    breadKeywords: ['roll', 'bun', 'bread', 'slider'],
    breadUnitsPerAdult: 1.5,
    weightKeywords: ['rice', 'pasta', 'mashed'],
    weightGramsPerAdult: 90,
    wholeUnitKeywords: ['whole potato', 'baked potato', 'corn', 'ear of corn'],
    wholeUnitsPerAdult: 1,
    fallbackWeightGramsPerAdult: 90,
  },

  // General unit-vs-weight detection, used for sides and as a carb fallback.
  unitKeywords: [
    'potato', 'corn', 'roll', 'bun', 'slider', 'drumstick', 'wing',
    'ear of corn', 'baked potato',
  ],
  // Prepared dishes that happen to contain a unit keyword but are actually
  // scooped/spooned, not counted piece by piece (e.g. "potato salad").
  nonUnitPhrases: [
    'potato salad', 'mashed potato', 'potato soup', 'potato gratin',
    'scalloped potato', 'potato pancake', 'potato casserole',
    'corn salad', 'corn soup', 'corn chowder', 'creamed corn',
  ],

  rounding: {
    weightKg: 0.05,
  },

  kgToLb: 2.20462,
}

let nextId = 1
const makeItem = (name) => ({ id: nextId++, name })

function includesAny(text, keywords) {
  return keywords.some((k) => text.includes(k))
}

function scaleByCount(table, count) {
  const match = table.find((row) => count <= row.maxCount)
  return match ?? table[table.length - 1]
}

function isBoneIn(name) {
  return includesAny(name.toLowerCase(), CONFIG.protein.boneInKeywords)
}

function isSpecial(name) {
  return includesAny(name.toLowerCase(), CONFIG.protein.specialKeywords)
}

function isRackItem(name) {
  return includesAny(name.toLowerCase(), CONFIG.protein.rack.keywords)
}

// Decides how a protein/appetizer item should be counted: by the rack (lamb
// ribs), or by weight (everything else), applying the special-cut and
// late-night-appetizer boosts either way.
function classifyProtein(name, { isAppetizer, itemCountForTier }) {
  const lower = name.toLowerCase()
  const special = isSpecial(lower)

  if (isRackItem(lower)) {
    let ribsPerAdult = scaleByCount(CONFIG.protein.rack.ribsPerAdultByItemCount, itemCountForTier).ribs
    if (special) ribsPerAdult *= CONFIG.protein.specialMultiplier
    if (isAppetizer) ribsPerAdult *= CONFIG.appetizers.lateNightMultiplier
    return { basis: 'rack', ribsPerAdult, special }
  }

  const boneIn = isBoneIn(lower)
  let gramsPerAdult = isAppetizer
    ? scaleByCount(CONFIG.appetizers.gramsPerAdultByItemCount, itemCountForTier).grams
    : scaleByCount(CONFIG.protein.mainsGramsPerAdultByItemCount, itemCountForTier).grams
  if (boneIn) gramsPerAdult *= CONFIG.protein.boneInMultiplier
  if (special) gramsPerAdult *= CONFIG.protein.specialMultiplier
  if (isAppetizer) gramsPerAdult *= CONFIG.appetizers.lateNightMultiplier
  return { basis: 'weight', gramsPerAdult, boneIn, special }
}

function isUnitBased(name) {
  const lower = name.toLowerCase()
  if (includesAny(lower, CONFIG.nonUnitPhrases)) return false
  return includesAny(lower, CONFIG.unitKeywords)
}

// Decides whether a carb is counted by weight (grams/adult) or by unit
// (pieces/adult), and returns the relevant per-adult baseline.
function classifyCarb(name) {
  const lower = name.toLowerCase()
  const { carbs } = CONFIG

  if (includesAny(lower, carbs.weightKeywords)) {
    return { basis: 'weight', gramsPerAdult: carbs.weightGramsPerAdult }
  }
  if (includesAny(lower, carbs.breadKeywords)) {
    return { basis: 'unit', unitsPerAdult: carbs.breadUnitsPerAdult }
  }
  if (includesAny(lower, carbs.wholeUnitKeywords)) {
    return { basis: 'unit', unitsPerAdult: carbs.wholeUnitsPerAdult }
  }
  if (isUnitBased(name)) {
    return { basis: 'unit', unitsPerAdult: carbs.wholeUnitsPerAdult }
  }
  return { basis: 'weight', gramsPerAdult: carbs.fallbackWeightGramsPerAdult }
}

function roundToStep(value, step) {
  return Math.round(value / step) * step
}

function totalGramsFor(gramsPerAdult, adults, kids) {
  return gramsPerAdult * adults + gramsPerAdult * CONFIG.kidFactor * kids
}

function totalUnitsFor(unitsPerAdult, adults, kids) {
  return unitsPerAdult * adults + unitsPerAdult * CONFIG.kidFactor * kids
}

// Builds the display-ready result for one appetizer/main item from its
// classification (weight-based or rack-based).
function buildProteinResult(item, classification, adults, kids) {
  if (classification.basis === 'rack') {
    const totalRibs = totalUnitsFor(classification.ribsPerAdult, adults, kids)
    return { ...item, basis: 'rack', totalRibs, special: classification.special }
  }
  const totalGrams = totalGramsFor(classification.gramsPerAdult, adults, kids)
  return {
    ...item,
    basis: 'weight',
    totalGrams,
    boneIn: classification.boneIn,
    special: classification.special,
  }
}

// Runs the full calculation for every item currently on the lists. Returns
// per-item results plus grand totals, all in raw grams/units/ribs so
// rounding only happens once, at display time.
function calculateResults({ adults, kids, appetizers, mains, sides, carbs }) {
  const sideAndCarbCount = sides.length + carbs.length

  const mainsResults = mains.map((item) => {
    const classification = classifyProtein(item.name, {
      isAppetizer: false,
      itemCountForTier: sideAndCarbCount,
    })
    return buildProteinResult(item, classification, adults, kids)
  })

  const appetizerResults = appetizers.map((item) => {
    const classification = classifyProtein(item.name, {
      isAppetizer: true,
      itemCountForTier: appetizers.length,
    })
    return buildProteinResult(item, classification, adults, kids)
  })

  const sideBaseline = scaleByCount(CONFIG.sides.gramsPerAdultByItemCount, sides.length).grams
  const sideUnitBaseline = scaleByCount(CONFIG.sides.unitsPerAdultByItemCount, sides.length).units

  const sideResults = sides.map((item) => {
    if (isUnitBased(item.name)) {
      const totalUnits = totalUnitsFor(sideUnitBaseline, adults, kids)
      return { ...item, basis: 'unit', totalUnits }
    }
    const totalGrams = totalGramsFor(sideBaseline, adults, kids)
    return { ...item, basis: 'weight', totalGrams }
  })

  const carbResults = carbs.map((item) => {
    const classification = classifyCarb(item.name)
    if (classification.basis === 'unit') {
      const totalUnits = totalUnitsFor(classification.unitsPerAdult, adults, kids)
      return { ...item, basis: 'unit', totalUnits }
    }
    const totalGrams = totalGramsFor(classification.gramsPerAdult, adults, kids)
    return { ...item, basis: 'weight', totalGrams }
  })

  const allItems = [...appetizerResults, ...mainsResults, ...sideResults, ...carbResults]
  const allWeightItems = allItems.filter((i) => i.basis === 'weight')
  const allUnitItems = allItems.filter((i) => i.basis === 'unit')
  const allRackItems = allItems.filter((i) => i.basis === 'rack')

  const grandTotalKg = roundToStep(
    allWeightItems.reduce((sum, i) => sum + i.totalGrams, 0) / 1000,
    CONFIG.rounding.weightKg
  )
  const grandTotalUnits = allUnitItems.reduce(
    (sum, i) => sum + Math.ceil(i.totalUnits),
    0
  )
  const grandTotalRacks = allRackItems.reduce(
    (sum, i) => sum + Math.ceil(i.totalRibs / CONFIG.protein.rack.ribsPerRack),
    0
  )

  return {
    appetizerResults,
    mainsResults,
    sideResults,
    carbResults,
    grandTotalKg,
    grandTotalUnits,
    grandTotalRacks,
  }
}

function formatWeight(totalGrams, useLbs) {
  const kg = roundToStep(totalGrams / 1000, CONFIG.rounding.weightKg)
  if (useLbs) {
    return `${(kg * CONFIG.kgToLb).toFixed(1)} lb`
  }
  return `${kg.toFixed(2)} kg`
}

function formatUnits(totalUnits) {
  const units = Math.ceil(totalUnits)
  return `${units} ${units === 1 ? 'piece' : 'pieces'}`
}

function formatRacks(totalRibs) {
  const racks = Math.ceil(totalRibs / CONFIG.protein.rack.ribsPerRack)
  return `${racks} ${racks === 1 ? 'rack' : 'racks'}`
}

function ItemList({ label, placeholder, items, onAdd, onRemove }) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="card">
      <h2>{label}</h2>
      <div className="add-row">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="btn-add" onClick={submit}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <button
                type="button"
                className="btn-remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => onRemove(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function App() {
  const [adults, setAdults] = useState(10)
  const [kids, setKids] = useState(0)
  const [appetizers, setAppetizers] = useState([])
  const [mains, setMains] = useState([])
  const [sides, setSides] = useState([])
  const [carbs, setCarbs] = useState([])
  const [useLbs, setUseLbs] = useState(false)

  const buildSnapshot = () => JSON.stringify({ adults, kids, appetizers, mains, sides, carbs })

  const [results, setResults] = useState(() =>
    calculateResults({ adults, kids, appetizers, mains, sides, carbs })
  )
  const [calculatedSnapshot, setCalculatedSnapshot] = useState(buildSnapshot)

  const currentSnapshot = buildSnapshot()
  const isStale = currentSnapshot !== calculatedSnapshot

  const handleCalculate = () => {
    setResults(calculateResults({ adults, kids, appetizers, mains, sides, carbs }))
    setCalculatedSnapshot(currentSnapshot)
  }

  const hasAnyItems = appetizers.length + mains.length + sides.length + carbs.length > 0

  const addTo = (setter) => (name) => setter((prev) => [...prev, makeItem(name)])
  const removeFrom = (setter) => (id) => setter((prev) => prev.filter((i) => i.id !== id))

  const renderRows = (items) =>
    items.map((item) => (
      <tr key={item.id}>
        <td>
          {item.name}
          {item.boneIn && <span className="tag">bone-in</span>}
          {item.special && <span className="tag tag-special">premium</span>}
        </td>
        <td>
          {item.basis === 'weight' && formatWeight(item.totalGrams, useLbs)}
          {item.basis === 'unit' && formatUnits(item.totalUnits)}
          {item.basis === 'rack' && formatRacks(item.totalRibs)}
        </td>
      </tr>
    ))

  return (
    <div className="app">
      <header>
        <h1>Party Food Calculator</h1>
        <p className="subtitle">Figure out how much to buy before you shop.</p>
      </header>

      <section className="card">
        <h2>Guests</h2>
        <div className="guest-inputs">
          <label>
            Adults
            <input
              type="number"
              min="0"
              value={adults}
              onChange={(e) => setAdults(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label>
            Kids
            <input
              type="number"
              min="0"
              value={kids}
              onChange={(e) => setKids(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        </div>
        <p className="hint">Kids are calculated at 55% of an adult portion.</p>
      </section>

      <ItemList
        label="Appetizers"
        placeholder="e.g. chicken wings"
        items={appetizers}
        onAdd={addTo(setAppetizers)}
        onRemove={removeFrom(setAppetizers)}
      />

      <ItemList
        label="Mains"
        placeholder="e.g. chicken thighs"
        items={mains}
        onAdd={addTo(setMains)}
        onRemove={removeFrom(setMains)}
      />

      <ItemList
        label="Sides"
        placeholder="e.g. potato salad"
        items={sides}
        onAdd={addTo(setSides)}
        onRemove={removeFrom(setSides)}
      />

      <ItemList
        label="Carbs"
        placeholder="e.g. dinner rolls"
        items={carbs}
        onAdd={addTo(setCarbs)}
        onRemove={removeFrom(setCarbs)}
      />

      <button type="button" className="btn-calculate" onClick={handleCalculate}>
        {isStale ? 'Recalculate' : 'Calculate'}
      </button>

      <section className="card results">
        <div className="results-header">
          <h2>Results</h2>
          <label className="unit-toggle">
            <span className={useLbs ? '' : 'active'}>kg</span>
            <input
              type="checkbox"
              checked={useLbs}
              onChange={(e) => setUseLbs(e.target.checked)}
            />
            <span className={useLbs ? 'active' : ''}>lb</span>
          </label>
        </div>

        {!hasAnyItems && (
          <p className="hint">Add some appetizers, mains, sides, or carbs, then hit Calculate.</p>
        )}

        {hasAnyItems && isStale && (
          <p className="stale-note">
            Inputs changed since the last calculation — click Recalculate to update these totals.
          </p>
        )}

        <div className={`results-body${isStale ? ' is-stale' : ''}`}>
        {appetizers.length > 0 && (
          <>
            <h3>Appetizers</h3>
            <table>
              <tbody>{renderRows(results.appetizerResults)}</tbody>
            </table>
          </>
        )}

        {mains.length > 0 && (
          <>
            <h3>Mains</h3>
            <table>
              <tbody>{renderRows(results.mainsResults)}</tbody>
            </table>
          </>
        )}

        {sides.length > 0 && (
          <>
            <h3>Sides</h3>
            <table>
              <tbody>{renderRows(results.sideResults)}</tbody>
            </table>
          </>
        )}

        {carbs.length > 0 && (
          <>
            <h3>Carbs</h3>
            <table>
              <tbody>{renderRows(results.carbResults)}</tbody>
            </table>
          </>
        )}

        {hasAnyItems && (
          <div className="grand-total">
            <div>
              <span className="label">Total weight</span>
              <span className="value">
                {useLbs
                  ? `${(results.grandTotalKg * CONFIG.kgToLb).toFixed(1)} lb`
                  : `${results.grandTotalKg.toFixed(2)} kg`}
              </span>
            </div>
            {results.grandTotalUnits > 0 && (
              <div>
                <span className="label">Total pieces</span>
                <span className="value">{results.grandTotalUnits}</span>
              </div>
            )}
            {results.grandTotalRacks > 0 && (
              <div>
                <span className="label">Total racks</span>
                <span className="value">{results.grandTotalRacks}</span>
              </div>
            )}
          </div>
        )}
        </div>
      </section>
    </div>
  )
}
