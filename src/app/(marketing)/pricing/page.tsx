import Link from 'next/link';
import styles from '../marketing.module.css';

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for teams of all sizes. Start free, upgrade when you need to.',
};

const check = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function PricingPage() {
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
          <span className={styles.heroBadge}>Pricing</span>
          <h1 className={styles.heroTitle}>Simple, transparent pricing</h1>
          <p className={styles.heroDesc}>
            Start for free with your whole team. Upgrade to Pro for advanced features and unlimited history.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.pricingGrid}>
            {/* Free */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingBody}>
                <div className={styles.pricingPlan}>Free</div>
                <div className={styles.pricingDesc}>For small teams getting started</div>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>$0</span>
                  <span className={styles.pricingPeriod}>/month</span>
                </div>
                <Link href="/signup" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Get Started
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>{check} Up to 25 members</li>
                  <li>{check} Unlimited channels</li>
                  <li>{check} 10,000 message history</li>
                  <li>{check} Basic notifications</li>
                  <li>{check} Community support</li>
                </ul>
              </div>
            </div>

            {/* Pro */}
            <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
              <div className={styles.pricingPopular}>Most Popular</div>
              <div className={styles.pricingBody}>
                <div className={styles.pricingPlan}>Pro</div>
                <div className={styles.pricingDesc}>For growing teams that need more</div>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>$8</span>
                  <span className={styles.pricingPeriod}>/member/month</span>
                </div>
                <Link href="/signup" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Start Free Trial
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>{check} Unlimited members</li>
                  <li>{check} Unlimited channels</li>
                  <li>{check} Full message history</li>
                  <li>{check} Advanced email digests</li>
                  <li>{check} Priority support</li>
                  <li>{check} Admin controls &amp; audit logs</li>
                  <li>{check} Custom roles &amp; permissions</li>
                </ul>
              </div>
            </div>

            {/* Enterprise */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingBody}>
                <div className={styles.pricingPlan}>Enterprise</div>
                <div className={styles.pricingDesc}>For organizations with advanced needs</div>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>Custom</span>
                </div>
                <Link href="/enterprise" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Contact Sales
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>{check} Everything in Pro</li>
                  <li>{check} SSO / SAML</li>
                  <li>{check} 99.99% SLA</li>
                  <li>{check} Dedicated account manager</li>
                  <li>{check} Custom integrations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionDesc}>Everything you need to know about our pricing.</p>
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Can I try Pro for free?</h3>
              <p className={styles.cardDesc}>
                Yes! Every new workspace gets a 14-day free trial of Pro features. No credit card required.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>What happens when my trial ends?</h3>
              <p className={styles.cardDesc}>
                Your workspace automatically moves to the Free plan. You keep all your data, but some features become limited.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Can I change plans later?</h3>
              <p className={styles.cardDesc}>
                Absolutely. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Do you offer discounts for nonprofits?</h3>
              <p className={styles.cardDesc}>
                Yes, we offer free Pro plans for qualifying nonprofits and educational institutions. Contact us to learn more.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>Ready to get started?</h2>
        <p className={styles.ctaBannerDesc}>Create your workspace in seconds. No credit card required.</p>
        <Link href="/signup" className={`btn ${styles.ctaBtn}`}>Start for Free</Link>
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
