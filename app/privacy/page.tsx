import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Key Assist collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "1 May 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <nav className="mb-8 text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Privacy Policy</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-shop-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-shop-muted">Effective date: {EFFECTIVE_DATE}</p>

      <div className="prose-custom mt-10 space-y-10 text-sm leading-relaxed text-shop-ink">

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">1. Who we are</h2>
          <p>
            Key Assist (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the Key Assist platform, including the website, mobile applications, and associated services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">2. Information we collect</h2>
          <p className="mb-3">We collect information in the following ways:</p>
          <ul className="ml-5 list-disc space-y-2 text-shop-ink">
            <li><span className="font-medium">Account data</span> — name, email address, and password when you register.</li>
            <li><span className="font-medium">Profile data</span> — optional phone number and shipping address you provide.</li>
            <li><span className="font-medium">Transaction data</span> — orders, cart contents, and payment references (we do not store full card numbers).</li>
            <li><span className="font-medium">Usage data</span> — pages visited, search queries, product links imported, and device/browser information.</li>
            <li><span className="font-medium">Communications</span> — messages you send us via the contact form or support tickets.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">3. How we use your information</h2>
          <ul className="ml-5 list-disc space-y-2">
            <li>To create and manage your account.</li>
            <li>To process orders and facilitate payments through our payment partners.</li>
            <li>To personalise your shopping experience and surface relevant products.</li>
            <li>To send transactional emails (order confirmations, shipping updates).</li>
            <li>To respond to your enquiries and provide customer support.</li>
            <li>To detect fraud and improve platform security.</li>
            <li>To analyse usage patterns and improve our services.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">4. Sharing your information</h2>
          <p className="mb-3">We do not sell your personal data. We share information only in the following circumstances:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li><span className="font-medium">Service providers</span> — payment processors, email delivery, cloud infrastructure, and analytics tools that process data on our behalf under contractual data-protection obligations.</li>
            <li><span className="font-medium">Legal requirements</span> — when required by law, regulation, court order, or to protect the rights and safety of Key Assist or others.</li>
            <li><span className="font-medium">Business transfers</span> — in connection with a merger, acquisition, or sale of assets, subject to confidentiality obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">5. Cookies and tracking</h2>
          <p>
            We use essential cookies to keep you signed in and maintain your session. We may use analytics cookies to understand how the platform is used. You can control non-essential cookies through your browser settings. Disabling cookies may limit some features.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">6. Data retention</h2>
          <p>
            We retain your account data for as long as your account is active or as needed to provide services. You may request deletion of your account at any time by contacting us. We may retain certain data for legal, fraud-prevention, or legitimate business purposes as required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">7. Security</h2>
          <p>
            We use industry-standard measures — including TLS encryption in transit and hashed password storage — to protect your information. No system is completely secure, and we cannot guarantee absolute security. We encourage you to use a strong, unique password and to enable two-factor authentication where available.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">8. Your rights</h2>
          <p className="mb-3">Depending on your location, you may have the right to:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Data portability in a machine-readable format.</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, please contact us at the address below.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">9. Children&rsquo;s privacy</h2>
          <p>
            Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">10. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the effective date above and, where appropriate, by email. Your continued use of our services after changes take effect constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">11. Contact us</h2>
          <p>
            If you have any questions about this Privacy Policy or how we handle your data, please reach out via our{" "}
            <Link href="/contact" className="font-medium text-shop-accent underline underline-offset-2 hover:text-shop-accent-hover">
              contact page
            </Link>
            .
          </p>
        </section>

      </div>

      <div className="mt-12 border-t border-shop-border pt-8 text-xs text-shop-muted">
        <Link href="/terms" className="hover:text-shop-ink">Terms of Service</Link>
        <span className="mx-2">·</span>
        <Link href="/" className="hover:text-shop-ink">Back to home</Link>
      </div>
    </div>
  );
}
