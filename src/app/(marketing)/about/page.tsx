import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'About',
  description: 'Learn about Semloh Systems and the mission behind Chatterbox — building the future of team communication.',
};

export default function AboutPage() {
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
          <span className={styles.heroBadge}>About Us</span>
          <h1 className={styles.heroTitle}>Built by Semloh Systems</h1>
          <p className={styles.heroDesc}>
            We started Chatterbox because we believed team communication should be fast, simple, and accessible to everyone — not just enterprises with big budgets.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-primary">Get Started</Link>
            <Link href="/company" className="btn">Our Company</Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.statsRow}>
            <div>
              <div className={styles.statValue}>10K+</div>
              <div className={styles.statLabel}>Teams</div>
            </div>
            <div>
              <div className={styles.statValue}>50M+</div>
              <div className={styles.statLabel}>Messages</div>
            </div>
            <div>
              <div className={styles.statValue}>99.9%</div>
              <div className={styles.statLabel}>Uptime</div>
            </div>
            <div>
              <div className={styles.statValue}>150+</div>
              <div className={styles.statLabel}>Countries</div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <p className={styles.sectionDesc}>The principles that guide everything we build.</p>
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Speed</h3>
              <p className={styles.cardDesc}>Messages should arrive instantly. Our infrastructure is built for real-time performance across the globe.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Security</h3>
              <p className={styles.cardDesc}>Your conversations are yours. End-to-end encryption, SOC 2 compliance, and zero-access architecture.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Simplicity</h3>
              <p className={styles.cardDesc}>No bloated features. No confusing menus. Just clean, intuitive communication that gets out of your way.</p>
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
              <h3 className={styles.cardTitle}>Community</h3>
              <p className={styles.cardDesc}>We build with our users. Open roadmap, public feedback, and a free tier that actually works.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Join thousands of teams on Chatterbox</h2>
        <p className={styles.ctaBannerDesc}>Start communicating better today. Free forever for small teams.</p>
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
