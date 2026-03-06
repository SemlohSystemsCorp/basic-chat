import { Navbar } from "~/components/navbar";

export default function PrivacyPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: March 6, 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p>When you use Module, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Account information:</strong>{" "}
                Email address, username, display name, and avatar when you
                create an account
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> Meeting
                history, call duration, and feature usage
              </li>
              <li>
                <strong className="text-foreground">Payment information:</strong>{" "}
                Billing details processed securely through Stripe. We do not
                store your card number
              </li>
              <li>
                <strong className="text-foreground">Recordings:</strong> Meeting
                recordings if enabled by the host, stored securely and
                accessible only to the host
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional emails (verification, password reset)</li>
              <li>Improve the Service and develop new features</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              3. Data Storage and Security
            </h2>
            <p>
              Your data is stored using Supabase infrastructure with
              row-level security. Video calls are processed through
              Daily.co&apos;s encrypted infrastructure. Payments are handled by
              Stripe. We implement appropriate security measures to protect
              your personal information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              4. Chat Messages
            </h2>
            <p>
              In-call chat messages are stored temporarily during the meeting
              and are deleted when the meeting ends. We do not retain chat
              messages after the call has concluded.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              5. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Supabase</strong> for
                authentication and database
              </li>
              <li>
                <strong className="text-foreground">Daily.co</strong> for video
                call infrastructure
              </li>
              <li>
                <strong className="text-foreground">Stripe</strong> for payment
                processing
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> for
                transactional emails
              </li>
            </ul>
            <p>
              Each service has its own privacy policy governing their handling
              of your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              6. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              7. Cookies
            </h2>
            <p>
              We use essential cookies for authentication and session
              management. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              9. Contact
            </h2>
            <p>
              For privacy-related inquiries, contact us at{" "}
              <a
                href="mailto:support@georgeholmes.io"
                className="text-primary hover:text-primary/80"
              >
                support@georgeholmes.io
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
