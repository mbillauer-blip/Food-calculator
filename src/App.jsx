import { useMemo, useState } from 'react'
import './App.css'

// ---------------------------------------------------------------------------
// Config: per-person baselines and unit-detection keywords, kept separate so
// the numbers are easy to tune without touching the calculation logic below.
// ---------------------------------------------------------------------------
const CONFIG = {
  kidFactor: 0.55,

  protein: {
    // Scales down as more sides/carbs join the table. First matching
    // maxCount wins, checked in ascending order.
    gramsPerAdultByItemCount: [
      { maxCount: 1, grams: 200 },
      { maxCount: 3, grams: 150 },
      { maxCount: Infinity, grams: 115 },
    ],
    boneInMultiplier: 1.35,
    boneInKeywords: [
      'thigh', 'drumstick', 'wing', 'rib', 'bone-in', 'bone in',
      'whole chicken', 'whole turkey',
    ],
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

// Runs the full calculation for every item currently on the lists. Returns
// per-item results plus grand totals, all in raw grams/units so rounding
// only happens once, at display time.
function calculateResults({ adults, kids, proteins, sides, carbs }) {
  const sideAndCarbCount = sides.length + carbs.length
  const proteinBaseline = scaleByCount(
    CONFIG.protein.gramsPerAdultByItemCount,
    sideAndCarbCount
  ).grams

  const proteinResults = proteins.map((item) => {
    const boneIn = isBoneIn(item.name)
    const gramsPerAdult = boneIn
      ? proteinBaseline * CONFIG.protein.boneInMultiplier
      : proteinBaseline
    const totalGrams = totalGramsFor(gramsPerAdult, adults, kids)
    return { ...item, basis: 'weight', totalGrams, boneIn }
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

  const allWeightItems = [...proteinResults, ...sideResults, ...carbResults].filter(
    (i) => i.basis === 'weight'
  )
  const allUnitItems = [...sideResults, ...carbResults].filter((i) => i.basis === 'unit')

  const grandTotalKg = roundToStep(
    allWeightItems.reduce((sum, i) => sum + i.totalGrams, 0) / 1000,
    CONFIG.rounding.weightKg
  )
  const grandTotalUnits = allUnitItems.reduce(
    (sum, i) => sum + Math.ceil(i.totalUnits),
    0
  )

  return { proteinResults, sideResults, carbResults, grandTotalKg, grandTotalUnits }
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
  const [proteins, setProteins] = useState([])
  const [sides, setSides] = useState([])
  const [carbs, setCarbs] = useState([])
  const [useLbs, setUseLbs] = useState(false)

  const results = useMemo(
    () => calculateResults({ adults, kids, proteins, sides, carbs }),
    [adults, kids, proteins, sides, carbs]
  )

  const hasAnyItems = proteins.length + sides.length + carbs.length > 0

  const addTo = (setter) => (name) => setter((prev) => [...prev, makeItem(name)])
  const removeFrom = (setter) => (id) => setter((prev) => prev.filter((i) => i.id !== id))

  const renderRows = (items) =>
    items.map((item) => (
      <tr key={item.id}>
        <td>
          {item.name}
          {item.boneIn && <span className="tag">bone-in</span>}
        </td>
        <td>
          {item.basis === 'weight'
            ? formatWeight(item.totalGrams, useLbs)
            : formatUnits(item.totalUnits)}
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
        label="Proteins"
        placeholder="e.g. chicken thighs"
        items={proteins}
        onAdd={addTo(setProteins)}
        onRemove={removeFrom(setProteins)}
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

        {!hasAnyItems && <p className="hint">Add some proteins, sides, or carbs to see totals.</p>}

        {proteins.length > 0 && (
          <>
            <h3>Proteins</h3>
            <table>
              <tbody>{renderRows(results.proteinResults)}</tbody>
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
          </div>
        )}
      </section>
    </div>
  )
}
