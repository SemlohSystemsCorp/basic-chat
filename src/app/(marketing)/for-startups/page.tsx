import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Chatterbox for Startups',
  description: 'Fast, free team communication built for fast-moving startup teams. Get started in seconds.',
};

export default function ForStartupsPage() {
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
          <span className={styles.heroBadge}>For Startups</span>
          <h1 className={styles.heroTitle}>Built for fast-moving teams</h1>
          <p className={styles.heroDesc}>
            Your startup moves fast. Your communication tool should too. Chatterbox is free to start, sets up in seconds, and scales as you grow.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-primary">Start for Free</Link>
            <Link href="/pricing" className="btn">See Pricing</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why startups choose Chatterbox</h2>
            <p className={styles.sectionDesc}>Everything you need, nothing you do not.</p>
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Free tier that works</h3>
              <p className={styles.cardDesc}>Up to 25 members, unlimited channels, and 10,000 messages of history. No credit card, no trial expiry.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Quick setup</h3>
              <p className={styles.cardDesc}>Create a workspace, invite your team, and start talking in under two minutes. No IT department required.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Scales with you</h3>
              <p className={styles.cardDesc}>From 3 co-founders to 300 employees, Chatterbox grows with your team. Upgrade to Pro when you are ready.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Real-time collaboration</h3>
              <p className={styles.cardDesc}>Instant messaging, channels, threads, and reactions. Keep your whole team aligned without endless email chains.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Your next chapter starts here</h2>
        <p className={styles.ctaBannerDesc}>Join thousands of startups already using Chatterbox to build faster.</p>
        <Link href="/signup" className={`btn ${styles.ctaBtn}`}>Get Started Free</Link>
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
