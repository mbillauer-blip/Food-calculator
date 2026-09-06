import { useDocumentMeta } from '../hooks/useDocumentMeta'

export default function PrivacyPolicy() {
  useDocumentMeta(
    'Privacy Policy — Party Food Calculator',
    'How Party Food Calculator handles data, cookies, and advertising.'
  )

  return (
    <div className="app">
      <header>
        <h1>Privacy Policy</h1>
      </header>

      <article className="card post-content">
        <p>
          Party Food Calculator doesn't require an account and doesn't collect or store the
          guest counts or menu items you enter — everything you type runs locally in your
          browser and disappears when you close the tab.
        </p>

        <h2>Cookies and advertising</h2>
        <p>
          This site may show ads served by Google AdSense. Google and its partners may use
          cookies or similar technologies to serve ads based on your visits to this site and
          other sites, and to measure ad performance. You can review or opt out of
          personalized advertising through{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            Google's Ads Settings
          </a>{' '}
          or{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
            aboutads.info
          </a>
          .
        </p>

        <h2>Analytics</h2>
        <p>
          If this site adds analytics in the future, this policy will be updated to describe
          what's collected and why.
        </p>

        <h2>Children's privacy</h2>
        <p>This site is not directed at children under 13 and does not knowingly collect data from them.</p>

        <h2>Contact</h2>
        <p>Questions about this policy can be sent to the site owner.</p>
      </article>
    </div>
  )
}
