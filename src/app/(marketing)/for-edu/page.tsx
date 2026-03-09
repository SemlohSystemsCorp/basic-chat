import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Chatterbox for Education',
  description: 'Free, safe team communication for classrooms, departments, and campus-wide collaboration.',
};

export default function ForEduPage() {
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
          <span className={styles.heroBadge}>For Education</span>
          <h1 className={styles.heroTitle}>Communication for classrooms and campuses</h1>
          <p className={styles.heroDesc}>
            Keep students, faculty, and staff connected with a safe, organized communication platform built for educational environments.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className="btn btn-primary">Get Started Free</Link>
            <Link href="mailto:contact@georgeholmes.io" className="btn">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why educators love Chatterbox</h2>
            <p className={styles.sectionDesc}>Purpose-built features for schools, colleges, and universities.</p>
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Free for schools</h3>
              <p className={styles.cardDesc}>Qualifying educational institutions get free access to Pro features. No budget approvals needed.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Safe environment</h3>
              <p className={styles.cardDesc}>Admin controls, content moderation tools, and privacy-first design keep students safe.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Organized by class &amp; department</h3>
              <p className={styles.cardDesc}>Create channels for each class, department, club, or project. Keep conversations focused and findable.</p>
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
              <h3 className={styles.cardTitle}>Role management</h3>
              <p className={styles.cardDesc}>Assign roles for students, teaching assistants, professors, and administrators with appropriate permissions for each.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Bring Chatterbox to your school</h2>
        <p className={styles.ctaBannerDesc}>Free for qualifying educational institutions. Get set up in minutes.</p>
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
