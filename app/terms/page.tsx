import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of Key Assist.",
};

const EFFECTIVE_DATE = "1 May 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <nav className="mb-8 text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Terms of Service</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-shop-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-shop-muted">Effective date: {EFFECTIVE_DATE}</p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-shop-ink">

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">1. Acceptance of terms</h2>
          <p>
            By accessing or using Key Assist (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, you may not use the Service. These Terms apply to all visitors, users, and others who access the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">2. Description of the Service</h2>
          <p className="mb-3">
            Key Assist is a unified commerce platform that enables users to search, discover, and purchase products from multiple third-party marketplaces and retailers through a single interface. We facilitate transactions but are not a party to sales between buyers and sellers on third-party platforms.
          </p>
          <p>
            Key Assist LLC (&ldquo;the Company&rdquo;) acts solely as an independent sourcing and export logistics agent and proxy buyer for the Customer. Our service fees cover physical intake, inspection, and export coordination. The contract for the purchase of goods is strictly between the Customer and the third-party merchant. The Company does not assume any product liability, warranties, or merchantability for items purchased via user-submitted links or submitted requests.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">3. Accounts</h2>
          <ul className="ml-5 list-disc space-y-2">
            <li>You must be at least 13 years old to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</li>
            <li>You agree to provide accurate and complete information when registering and to keep it up to date.</li>
            <li>Notify us immediately of any unauthorised use of your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">4. Purchases and payments</h2>
          <p className="mb-3">
            When you place an order through Key Assist, you are purchasing from the relevant third-party retailer. Key Assist processes payments on behalf of these retailers through our payment partners.
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Prices are displayed in your selected currency and are subject to change without notice.</li>
            <li>All sales are subject to the retailer&rsquo;s own terms, return, and refund policies.</li>
            <li>Key Assist does not guarantee product availability, accuracy of product descriptions, or pricing provided by third-party retailers.</li>
            <li>By submitting an order, you authorise us to charge your selected payment method for the total amount shown at checkout.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">5. Pricing and fees</h2>
          <p className="mb-3">Your total quote consists of two transparent components:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li><strong>Item Procurement &amp; Sourcing:</strong> the exact landed cost to purchase your item from the US merchant and deliver it to our Texas hub, including list price, seller domestic shipping, and merchant checkout fees.</li>
            <li><strong>Key Assist Concierge Fee:</strong> our flat or percentage-based operational fee (10–15% of the total value of your cart) covering physical intake, authenticity verification, USD currency processing, and export handling.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">6. Shipping, delivery, and customs</h2>
          <ul className="ml-5 list-disc space-y-2">
            <li>Delivery within Lagos: $6 per lb (2.72 kg), estimated 0–12 days.</li>
            <li>Delivery outside Lagos: $7 per lb (3.18 kg), estimated 0–15 days.</li>
            <li>There are no customs fees or additional charges when items arrive in Nigeria. Lagos pickup is free. Additional charges apply only if shipping outside Lagos.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">7. Insurance</h2>
          <p>
            Key Assist offers optional 5% and 3% insurance tiers that, if opted in, secure your items to Nigeria with full coverage of the declared item value in the event of loss.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">8. Prohibited items</h2>
          <p>
            You may not submit requests for dangerous items, liquids, batteries, or other similarly restricted goods for procurement or shipping through the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">9. Inspection rights</h2>
          <p>
            The Company reserves the explicit right to open and inspect any package arriving at our hub to verify that its contents match the commercial invoice before it is forwarded across international borders.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">10. Prohibited conduct</h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
            <li>Attempt to gain unauthorised access to any part of the Service or its related systems.</li>
            <li>Scrape, crawl, or extract data from the Service without our express written permission.</li>
            <li>Upload or transmit viruses, malware, or any other malicious code.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            <li>Engage in any conduct that disrupts or interferes with the integrity or performance of the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">11. Intellectual property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Key Assist and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent. Product names, logos, and brands of third-party retailers displayed on the Service remain the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">12. Third-party links and services</h2>
          <p>
            The Service may contain links to third-party websites, retailers, or services. These are provided for convenience only. Key Assist has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites or services. We encourage you to review the terms and privacy policies of any third-party services you use.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">13. Disclaimers</h2>
          <p>
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. Key Assist does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">14. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Key Assist and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of the Service, even if advised of the possibility of such damages. Our total liability for any claim arising out of or relating to these Terms shall not exceed the greater of (a) the amount you paid us in the twelve months preceding the claim, or (b) one hundred US dollars (USD $100).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">15. Governing law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict-of-law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in our principal place of business.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">16. Changes to these terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the effective date and, where appropriate, by email or in-app notification. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">17. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason. You may discontinue use of the Service at any time. Upon termination, these Terms will survive to the extent necessary to enforce any outstanding obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-shop-ink">18. Contact us</h2>
          <p>
            If you have any questions about these Terms, please reach out via our{" "}
            <Link href="/contact" className="font-medium text-shop-accent underline underline-offset-2 hover:text-shop-accent-hover">
              contact page
            </Link>
            .
          </p>
        </section>

      </div>

      <div className="mt-12 border-t border-shop-border pt-8 text-xs text-shop-muted">
        <Link href="/privacy" className="hover:text-shop-ink">Privacy Policy</Link>
        <span className="mx-2">·</span>
        <Link href="/" className="hover:text-shop-ink">Back to home</Link>
      </div>
    </div>
  );
}
