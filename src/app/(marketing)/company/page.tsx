import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Company',
  description: 'Semloh Systems is the company behind Chatterbox, based in Chicago, IL. Learn about our team and mission.',
};

export default function CompanyPage() {
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
          <span className={styles.heroBadge}>Company</span>
          <h1 className={styles.heroTitle}>Semloh Systems</h1>
          <p className={styles.heroDesc}>
            Based in Chicago, IL, Semloh Systems builds tools that help teams communicate and collaborate with zero friction.
          </p>
          <div className={styles.heroCta}>
            <Link href="/about" className="btn btn-primary">Our Story</Link>
            <Link href="mailto:contact@georgeholmes.io" className="btn">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Leadership</h2>
            <p className={styles.sectionDesc}>The people building the future of team communication.</p>
          </div>
          <div className={styles.grid3}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Founder &amp; CEO</h3>
              <p className={styles.cardDesc}>Leading product vision and company strategy from day one.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Head of Engineering</h3>
              <p className={styles.cardDesc}>Building reliable, scalable infrastructure for real-time messaging.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Head of Design</h3>
              <p className={styles.cardDesc}>Crafting intuitive experiences that teams love to use every day.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Get in Touch</h2>
            <p className={styles.sectionDesc}>We would love to hear from you.</p>
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Email</h3>
              <p className={styles.cardDesc}>
                Reach us at <a href="mailto:contact@georgeholmes.io" style={{ color: '#635BFF' }}>contact@georgeholmes.io</a>
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Location</h3>
              <p className={styles.cardDesc}>Chicago, IL, United States</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Want to work with us?</h2>
        <p className={styles.ctaBannerDesc}>We are always looking for talented people to join our team.</p>
        <Link href="mailto:contact@georgeholmes.io" className={`btn ${styles.ctaBtn}`}>Get in Touch</Link>
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
