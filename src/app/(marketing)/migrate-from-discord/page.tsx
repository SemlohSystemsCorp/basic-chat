import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Migrate from Discord',
  description: 'Switch from Discord to Chatterbox. Purpose-built for work with enterprise-grade security and admin controls.',
};

export default function MigrateFromDiscordPage() {
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
          <span className={styles.heroBadge}>Migration</span>
          <h1 className={styles.heroTitle}>Switch from Discord to Chatterbox</h1>
          <p className={styles.heroDesc}>
            Discord is great for gaming. Chatterbox is purpose-built for work — with professional features, admin controls, and real security.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-primary">Start Migration</Link>
            <Link href="/pricing" className="btn">Compare Pricing</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Chatterbox vs Discord</h2>
            <p className={styles.sectionDesc}>Built for teams, not gamers.</p>
          </div>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className={styles.comparisonRow} style={{ borderBottom: '2px solid var(--color-border)', fontWeight: 600 }}>
              <div className={styles.comparisonLabel}>Feature</div>
              <div className={styles.comparisonThem}>Discord</div>
              <div className={styles.comparisonUs}>Chatterbox</div>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonLabel}>Business features</div>
              <div className={styles.comparisonThem}>Limited</div>
              <div className={styles.comparisonUs}>Purpose-built</div>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonLabel}>Admin controls</div>
              <div className={styles.comparisonThem}>Basic</div>
              <div className={styles.comparisonUs}>Advanced</div>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonLabel}>Security</div>
              <div className={styles.comparisonThem}>Consumer-grade</div>
              <div className={styles.comparisonUs}>Enterprise-grade</div>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonLabel}>File storage</div>
              <div className={styles.comparisonThem}>8MB limit</div>
              <div className={styles.comparisonUs}>Generous</div>
            </div>
            <div className={styles.comparisonRow}>
              <div className={styles.comparisonLabel}>Professional UI</div>
              <div className={styles.comparisonThem}>Gaming-focused</div>
              <div className={styles.comparisonUs}>Work-focused</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Migrate in 3 easy steps</h2>
            <p className={styles.sectionDesc}>Moving your team takes minutes, not days.</p>
          </div>
          <div className={styles.grid3}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>1. Create your workspace</h3>
              <p className={styles.cardDesc}>Sign up for Chatterbox and create a new workspace. It takes less than a minute.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>2. Invite your team</h3>
              <p className={styles.cardDesc}>Send email invites or share a link. Your team can join from any browser or device.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>3. Start chatting</h3>
              <p className={styles.cardDesc}>Set up your channels, configure notifications, and start communicating. You are done.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready for a professional upgrade?</h2>
        <p className={styles.ctaBannerDesc}>Join thousands of teams who have switched from Discord to Chatterbox.</p>
        <Link href="/signup" className={`btn ${styles.ctaBtn}`}>Start Free Migration</Link>
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
