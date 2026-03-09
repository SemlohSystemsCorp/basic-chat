import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Enterprise',
  description: 'Enterprise-grade team communication with SSO, advanced admin controls, 99.99% SLA, and dedicated support.',
};

export default function EnterprisePage() {
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
          <span className={styles.heroBadge}>Enterprise</span>
          <h1 className={styles.heroTitle}>Enterprise-grade communication</h1>
          <p className={styles.heroDesc}>
            Built for organizations that demand the highest levels of security, compliance, and reliability from their communication tools.
          </p>
          <div className={styles.heroCta}>
            <Link href="mailto:contact@georgeholmes.io" className="btn btn-primary">Contact Sales</Link>
            <Link href="/pricing" className="btn">View Pricing</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for scale and security</h2>
            <p className={styles.sectionDesc}>Everything your organization needs to communicate confidently.</p>
          </div>
          <div className={styles.grid3}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>SSO / SAML</h3>
              <p className={styles.cardDesc}>Single sign-on with your existing identity provider. Support for Okta, Azure AD, Google Workspace, and more.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Advanced Admin Controls</h3>
              <p className={styles.cardDesc}>Granular permissions, custom roles, domain verification, and organization-wide policies.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>99.99% SLA</h3>
              <p className={styles.cardDesc}>Guaranteed uptime backed by a service-level agreement with financial credits for any downtime.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Dedicated Support</h3>
              <p className={styles.cardDesc}>A named account manager plus priority support with guaranteed response times.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Audit Logs</h3>
              <p className={styles.cardDesc}>Complete audit trail of all administrative actions, logins, and data access for compliance requirements.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Custom Integrations</h3>
              <p className={styles.cardDesc}>Build bespoke integrations with our enterprise API, or work with our team to connect your internal tools.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready to bring Chatterbox to your organization?</h2>
        <p className={styles.ctaBannerDesc}>Talk to our sales team about a plan tailored to your needs.</p>
        <Link href="mailto:contact@georgeholmes.io" className={`btn ${styles.ctaBtn}`}>Contact Sales</Link>
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
