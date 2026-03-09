import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Newsroom',
  description: 'Press releases and news from Chatterbox and Semloh Systems.',
};

export default function NewsroomPage() {
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
          <span className={styles.heroBadge}>Newsroom</span>
          <h1 className={styles.heroTitle}>Press &amp; News</h1>
          <p className={styles.heroDesc}>
            The latest announcements and press releases from Chatterbox and Semloh Systems.
          </p>
          <div className={styles.heroCta}>
            <Link href="mailto:contact@georgeholmes.io" className="btn btn-primary">Press Inquiries</Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.postList}>
            <article className={styles.postItem}>
              <div className={styles.postDate}>March 1, 2026</div>
              <h2 className={styles.postTitle}>Chatterbox 2.0 Launches with Redesigned Experience</h2>
              <p className={styles.postExcerpt}>
                Semloh Systems today announced the release of Chatterbox 2.0, featuring a completely rebuilt interface, advanced threading, and a new notification engine designed for focused work.
              </p>
            </article>

            <article className={styles.postItem}>
              <div className={styles.postDate}>January 15, 2026</div>
              <h2 className={styles.postTitle}>Chatterbox Surpasses 10,000 Active Teams</h2>
              <p className={styles.postExcerpt}>
                The team communication platform now serves over 10,000 teams across 150 countries, with message volume growing 300% year over year.
              </p>
            </article>

            <article className={styles.postItem}>
              <div className={styles.postDate}>November 5, 2025</div>
              <h2 className={styles.postTitle}>Semloh Systems Introduces Enterprise Plan for Chatterbox</h2>
              <p className={styles.postExcerpt}>
                New enterprise tier includes SSO/SAML, 99.99% SLA, dedicated account management, and custom integrations for large organizations.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Want to cover Chatterbox?</h2>
        <p className={styles.ctaBannerDesc}>Reach out to our team for press kits, interviews, and more.</p>
        <Link href="mailto:contact@georgeholmes.io" className={`btn ${styles.ctaBtn}`}>Contact Press Team</Link>
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
