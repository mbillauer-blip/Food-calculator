import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT_ID } from '../lib/adsConfig'

// Renders one Google AdSense ad unit. Inert (renders nothing) until
// ADSENSE_CLIENT_ID and a slot id are both configured in adsConfig.js, so
// the site works normally before you're approved for AdSense.
export default function AdSlot({ slot }) {
  const insRef = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !slot || pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense script not loaded (e.g. blocked by an ad blocker) — skip.
    }
  }, [slot])

  if (!ADSENSE_CLIENT_ID || !slot) return null

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
