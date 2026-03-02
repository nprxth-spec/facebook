import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500 mt-2">Last updated: March 2, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Centxo platform ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">2. Service Description</h2>
            <p>Centxo provides Facebook Advertisement Management tools, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Campaign creation and management</li>
              <li>Automated ad optimization</li>
              <li>Analytics and reporting</li>
              <li>Multi-account management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">3. Account & Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials (including Facebook Login tokens) and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">4. Facebook Platform Policies</h2>
            <p>
              Our Service interacts with the Meta/Facebook Advertising Platform. You agree to comply with all applicable Facebook Terms and Policies, including the Facebook Advertising Policies. We are not responsible for any ad account bans or restrictions imposed by Meta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">5. Google Terms</h2>
            <p>
              Our Service interacts with Google API Services. By using the Service, you imply agreement to be bound by Google's Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">6. Subscription & Payments</h2>
            <p>
              Some features of the Service may require a paid subscription. You agree to provide accurate billing information and authorize us to charge your chosen payment method. Refunds are subject to our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">7. Data Usage</h2>
            <p>
              We collect and use data as described in our Privacy Policy. By using the Service, you consent to such collection and usage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
              Centxo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at support@centxo.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
