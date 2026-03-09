import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Blog',
  description: 'Updates, guides, and stories from the Chatterbox team.',
};

export default function BlogPage() {
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
          <span className={styles.heroBadge}>Blog</span>
          <h1 className={styles.heroTitle}>Chatterbox Blog</h1>
          <p className={styles.heroDesc}>
            Updates, guides, and stories from the team building the future of workplace communication.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.postList}>
            <article className={styles.postItem}>
              <div className={styles.postDate}>March 1, 2026</div>
              <h2 className={styles.postTitle}>Introducing Chatterbox 2.0</h2>
              <p className={styles.postExcerpt}>
                A completely redesigned experience with threads, reactions, advanced search, and a new notification system that actually respects your focus time.
              </p>
            </article>

            <article className={styles.postItem}>
              <div className={styles.postDate}>February 14, 2026</div>
              <h2 className={styles.postTitle}>Why We Built Chatterbox</h2>
              <p className={styles.postExcerpt}>
                Existing tools were either too expensive, too bloated, or too consumer-focused. We wanted something purpose-built for teams who just need to get work done.
              </p>
            </article>

            <article className={styles.postItem}>
              <div className={styles.postDate}>January 20, 2026</div>
              <h2 className={styles.postTitle}>Security Best Practices for Teams</h2>
              <p className={styles.postExcerpt}>
                From two-factor authentication to role-based access controls, here is how to keep your team conversations safe and secure on Chatterbox.
              </p>
            </article>

            <article className={styles.postItem}>
              <div className={styles.postDate}>December 8, 2025</div>
              <h2 className={styles.postTitle}>The Future of Team Communication</h2>
              <p className={styles.postExcerpt}>
                Async-first, AI-assisted, and privacy-respecting. Here is our vision for where team communication is heading and how Chatterbox is leading the way.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Stay in the loop</h2>
        <p className={styles.ctaBannerDesc}>Join Chatterbox and be the first to hear about new features.</p>
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
