import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Integrations',
  description: 'Connect Chatterbox with your favorite tools. GitHub, Slack, Google Drive, Notion, Figma, Jira, and more.',
};

const puzzleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z" />
  </svg>
);

const integrations = [
  { name: 'GitHub', desc: 'Coming soon' },
  { name: 'Slack', desc: 'Coming soon' },
  { name: 'Google Drive', desc: 'Coming soon' },
  { name: 'Notion', desc: 'Coming soon' },
  { name: 'Figma', desc: 'Coming soon' },
  { name: 'Jira', desc: 'Coming soon' },
  { name: 'Linear', desc: 'Coming soon' },
  { name: 'Zapier', desc: 'Coming soon' },
  { name: 'Stripe', desc: 'Coming soon' },
];

export default function IntegrationsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>Chatterbox</Link>
          <div className={styles.headerRight}>
            <Link href="/login" className={styles.navLink}>Log in</Link>
            <Link href="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>Integrations</span>
          <h1 className={styles.heroTitle}>Connect your favorite tools</h1>
          <p className={styles.heroDesc}>
            Bring your workflow into Chatterbox. Get notifications, share updates, and take action without leaving the conversation.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Available integrations</h2>
            <p className={styles.sectionDesc}>We are building integrations with the tools your team already uses.</p>
          </div>
          <div className={styles.grid3}>
            {integrations.map((integration) => (
              <div key={integration.name} className={styles.card}>
                <div className={styles.cardIcon}>{puzzleIcon}</div>
                <h3 className={styles.cardTitle}>{integration.name}</h3>
                <p className={styles.cardDesc}>{integration.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Need an integration we do not have yet?</h2>
        <p className={styles.ctaBannerDesc}>Let us know what tools you use and we will prioritize them on our roadmap.</p>
        <Link href="mailto:contact@georgeholmes.io" className={`btn ${styles.ctaBtn}`}>Request Integration</Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerCopy}>&copy; 2026 Chatterbox. All rights reserved.</span>
          <div className={styles.footerLinks}>
            <Link href="/terms" className={styles.footerLink}>Terms</Link>
            <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
            <Link href="/cookies" className={styles.footerLink}>Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
