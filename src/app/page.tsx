'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import styles from './page.module.css';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>Chatterbox</div>
            <nav className={styles.headerNav}>
              <a href="#features" className={styles.navLink}>Features</a>
              <a href="#pricing" className={styles.navLink}>Pricing</a>
              <a href="#security" className={styles.navLink}>Security</a>
            </nav>
          </div>
          <div className={styles.headerRight}>
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <Link href="/login" className={styles.navLink}>
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Now in Public Beta
            </div>
            <h1 className={styles.heroTitle}>
              The communication platform for everything important
            </h1>
            <p className={styles.heroSubtitle}>
              Chatterbox blends the best of Slack and Discord into one powerful workspace.
              Real-time channels, organized threads, and seamless collaboration for teams that move fast.
            </p>
            <div className={styles.heroCta}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Start for free
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Sign in to your Box
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.mockup}>
              <div className={styles.mockupSidebar}>
                <div className={styles.mockupSidebarHeader}>
                  <div className={styles.mockupDot} />
                  <span>Acme Inc</span>
                </div>
                <div className={styles.mockupSection}>Channels</div>
                <div className={styles.mockupChannel}>
                  <span>#</span> general
                </div>
                <div className={`${styles.mockupChannel} ${styles.active}`}>
                  <span>#</span> engineering
                </div>
                <div className={styles.mockupChannel}>
                  <span>#</span> design
                </div>
                <div className={styles.mockupChannel}>
                  <span>#</span> product
                </div>
                <div className={styles.mockupSection}>Direct Messages</div>
                <div className={styles.mockupDm}>
                  <div className={styles.mockupDmDot} style={{ background: 'var(--color-success)' }} />
                  Sarah Chen
                </div>
                <div className={styles.mockupDm}>
                  <div className={styles.mockupDmDot} />
                  Mike Rodriguez
                </div>
              </div>
              <div className={styles.mockupMain}>
                <div className={styles.mockupHeader}>
                  <strong># engineering</strong>
                  <span>3 members</span>
                </div>
                <div className={styles.mockupChat}>
                  <div className={styles.mockupMsg}>
                    <div className={styles.mockupAvatar}>S</div>
                    <div>
                      <div className={styles.mockupMsgMeta}>
                        <span className={styles.mockupMsgName}>Sarah Chen</span>
                        <span className={styles.mockupMsgTime}>10:42 AM</span>
                      </div>
                      <div className={styles.mockupMsgText}>
                        Just deployed the new auth system. All tests passing.
                      </div>
                    </div>
                  </div>
                  <div className={styles.mockupMsg}>
                    <div className={styles.mockupAvatar} style={{ background: 'rgba(0,208,132,0.1)', color: '#00D084' }}>M</div>
                    <div>
                      <div className={styles.mockupMsgMeta}>
                        <span className={styles.mockupMsgName}>Mike Rodriguez</span>
                        <span className={styles.mockupMsgTime}>10:44 AM</span>
                      </div>
                      <div className={styles.mockupMsgText}>
                        Nice work! I&apos;ll start on the billing integration next.
                      </div>
                    </div>
                  </div>
                  <div className={styles.mockupMsg}>
                    <div className={styles.mockupAvatar} style={{ background: 'rgba(229,107,107,0.1)', color: '#E56B6B' }}>A</div>
                    <div>
                      <div className={styles.mockupMsgMeta}>
                        <span className={styles.mockupMsgName}>Alex Kim</span>
                        <span className={styles.mockupMsgTime}>10:46 AM</span>
                      </div>
                      <div className={styles.mockupMsgText}>
                        The new dashboard designs are ready for review in #design
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.mockupInput}>
                  <span>Message #engineering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / Social Proof ── */}
      <section className={styles.logoBar}>
        <div className={styles.logoBarInner}>
          <p className={styles.logoBarText}>Trusted by fast-growing teams everywhere</p>
          <div className={styles.logoBarLogos}>
            <div className={styles.logoPlaceholder}>Startup Co</div>
            <div className={styles.logoPlaceholder}>TechFlow</div>
            <div className={styles.logoPlaceholder}>BuildLab</div>
            <div className={styles.logoPlaceholder}>ScaleUp</div>
            <div className={styles.logoPlaceholder}>DevForge</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <div className={styles.featuresInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Features</div>
            <h2 className={styles.sectionTitle}>Everything your team needs, nothing it doesn&apos;t</h2>
            <p className={styles.sectionSubtitle}>
              Built from the ground up for teams who need to move fast without losing context.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Organized Channels</h3>
              <p className={styles.featureDesc}>
                Keep conversations focused with dedicated channels for every topic, team, and project. Public or private.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Real-time Messaging</h3>
              <p className={styles.featureDesc}>
                Messages appear instantly across all devices. No refresh needed. Built on infrastructure that scales to millions.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Box Workspaces</h3>
              <p className={styles.featureDesc}>
                Create a &ldquo;Box&rdquo; for your company, team, or community. Invite members, manage roles, and scale as you grow.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Email Notifications</h3>
              <p className={styles.featureDesc}>
                Never miss important updates. Get digests and mentions delivered straight to your inbox with smart filtering.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Enterprise Security</h3>
              <p className={styles.featureDesc}>
                Row-level security, encrypted data at rest, role-based access control, and audit logs for compliance.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Simple Billing</h3>
              <p className={styles.featureDesc}>
                Free for small teams. Upgrade to Pro when you&apos;re ready for more members, storage, and advanced features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.pricingInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Pricing</div>
            <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
            <p className={styles.sectionSubtitle}>
              Start free. Upgrade when your team grows. No surprises.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {/* Free Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardBody}>
                <h3 className={styles.pricingPlan}>Free</h3>
                <p className={styles.pricingDesc}>For small teams getting started</p>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>$0</span>
                  <span className={styles.pricingPeriod}>/month</span>
                </div>
                <Link href="/signup" className="btn btn-secondary btn-full">
                  Get Started
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Up to 25 members
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Unlimited channels
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    10,000 message history
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Basic email notifications
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Community support
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
              <div className={styles.pricingPopular}>Most Popular</div>
              <div className={styles.pricingCardBody}>
                <h3 className={styles.pricingPlan}>Pro</h3>
                <p className={styles.pricingDesc}>For growing teams that need more</p>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>$8</span>
                  <span className={styles.pricingPeriod}>/member/month</span>
                </div>
                <Link href="/signup" className="btn btn-primary btn-full">
                  Start Free Trial
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Unlimited members
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Unlimited channels
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Full message history
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Advanced email digests
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Priority support
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Admin controls &amp; audit logs
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Custom roles &amp; permissions
                  </li>
                </ul>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardBody}>
                <h3 className={styles.pricingPlan}>Enterprise</h3>
                <p className={styles.pricingDesc}>For large organizations</p>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingAmount}>Custom</span>
                </div>
                <Link href="/signup" className="btn btn-secondary btn-full">
                  Contact Sales
                </Link>
                <ul className={styles.pricingFeatures}>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Everything in Pro
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    SSO / SAML
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    99.99% SLA
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Dedicated account manager
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Custom integrations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security Section ── */}
      <section className={styles.security} id="security">
        <div className={styles.securityInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Security</div>
            <h2 className={styles.sectionTitle}>Built secure from day one</h2>
            <p className={styles.sectionSubtitle}>
              Your data is protected with enterprise-grade security at every layer.
            </p>
          </div>
          <div className={styles.securityGrid}>
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h4 className={styles.securityItemTitle}>Row-Level Security</h4>
                <p className={styles.securityItemDesc}>Database policies ensure users only access data they&apos;re authorized to see.</p>
              </div>
            </div>
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h4 className={styles.securityItemTitle}>Encrypted at Rest</h4>
                <p className={styles.securityItemDesc}>All data is encrypted with AES-256. Connections are TLS 1.3 encrypted.</p>
              </div>
            </div>
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h4 className={styles.securityItemTitle}>Role-Based Access</h4>
                <p className={styles.securityItemDesc}>Owner, admin, and member roles with granular permission controls.</p>
              </div>
            </div>
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h4 className={styles.securityItemTitle}>Audit Logging</h4>
                <p className={styles.securityItemDesc}>Full audit trail for compliance. Track every action across your workspace.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2 className={styles.ctaBannerTitle}>Ready to transform how your team communicates?</h2>
          <p className={styles.ctaBannerText}>
            Join thousands of teams already using Chatterbox. Free to start, no credit card required.
          </p>
          <div className={styles.ctaBannerActions}>
            <Link href="/signup" className={`btn btn-lg ${styles.ctaBtn}`}>
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>Chatterbox</div>
              <p className={styles.footerBrandText}>
                The communication platform for everything important.
                Built for teams who value clarity, speed, and security.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Product</h4>
                <a href="#features" className={styles.footerLink}>Features</a>
                <a href="#pricing" className={styles.footerLink}>Pricing</a>
                <a href="#security" className={styles.footerLink}>Security</a>
                <a href="#" className={styles.footerLink}>Changelog</a>
              </div>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Company</h4>
                <a href="#" className={styles.footerLink}>About</a>
                <a href="#" className={styles.footerLink}>Blog</a>
                <a href="#" className={styles.footerLink}>Careers</a>
                <a href="#" className={styles.footerLink}>Contact</a>
              </div>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Legal</h4>
                <a href="#" className={styles.footerLink}>Privacy</a>
                <a href="#" className={styles.footerLink}>Terms</a>
                <a href="#" className={styles.footerLink}>Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>
              &copy; {new Date().getFullYear()} Chatterbox. All rights reserved.
            </p>
            <div className={styles.footerSocial}>
              <a href="#" className={styles.footerSocialLink} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className={styles.footerSocialLink} aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className={styles.footerSocialLink} aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
