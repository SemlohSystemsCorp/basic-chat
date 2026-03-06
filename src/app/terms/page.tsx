import { Navbar } from "~/components/navbar";

export default function TermsPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: March 6, 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Module (&quot;the Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree to
              these terms, do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p>
              Module provides video conferencing services including real-time
              video and audio calls, screen sharing, in-call messaging, and
              meeting recording capabilities. The Service is provided on a
              free and paid subscription basis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              3. User Accounts
            </h2>
            <p>
              You must create an account to use the Service. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activities that occur under your
              account. You must provide accurate and complete information when
              creating your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>
                Record or distribute content from calls without the consent
                of all participants
              </li>
              <li>
                Interfere with or disrupt the Service or servers connected to
                the Service
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the
                Service
              </li>
              <li>
                Use the Service to transmit harmful, offensive, or
                inappropriate content
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              5. Subscriptions and Billing
            </h2>
            <p>
              Paid plans are billed monthly via Stripe. You may cancel your
              subscription at any time. Cancellation takes effect at the end
              of the current billing period. Refunds are not provided for
              partial months of service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              6. Meeting Recordings
            </h2>
            <p>
              If your plan includes recording, you are responsible for
              obtaining consent from all participants before recording a
              meeting. Recordings are stored securely and are accessible only
              to the meeting host.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              7. Limitation of Liability
            </h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind. We shall not be liable for any indirect, incidental,
              or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              8. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. We will notify you
              of any material changes by posting the updated terms on the
              Service. Continued use of the Service after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              9. Contact
            </h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
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
