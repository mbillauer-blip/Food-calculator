import { useState } from 'react'
import ItemList from '../components/ItemList'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import {
  CONFIG,
  makeItem,
  calculateResults,
  formatWeight,
  formatUnits,
  formatRacks,
} from '../lib/foodMath'

export default function CalculatorPage() {
  useDocumentMeta(
    'Party Food Calculator',
    'Calculate how much protein, sides, and carbs to buy for a party based on your guest count and menu.'
  )

  const [adults, setAdults] = useState(0)
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
