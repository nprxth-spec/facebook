import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-2">Last updated: March 2, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">1. Introduction</h2>
            <p>
              Centxo ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy tells you how we look after your personal data when you use the Centxo platform and tells you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">2. The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address, Facebook profile information, and Google profile (name, picture).</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website and services.</li>
              <li><strong>Ad Data:</strong> information about your Facebook Ad Campaigns, Ad Sets, and Ads imported via API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To provide and maintain the Service (managing your ads).</li>
              <li>To authenticate you via Facebook Login and Google Sign-In.</li>
              <li>To improve the Service and develop new features.</li>
              <li>To provide customer support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">4. Facebook Data</h2>
            <p>
              Our App uses Facebook Login, the Marketing API, and Pages API. We request the following permissions: <code>email</code>, <code>public_profile</code>, <code>ads_read</code>, <code>ads_management</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_messaging</code>, <code>pages_manage_metadata</code>, <code>pages_manage_ads</code>, <code>business_management</code>. We use these to provide ad management, Inbox (Messenger conversations), and analytics. We do not sell this data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">5. Google Data</h2>
            <p>
              Our App uses Google Sign-In for authentication and Google Sheets API for the Export feature. We collect email address, name, and profile picture from your Google User Data. With your consent, we request the <code>drive.file</code> scope to export your ad data (campaigns, ads, insights) to Google Sheets. You select the spreadsheet via Google Picker; we access only the files you explicitly choose. Centxo's use and transfer of information received from Google APIs adheres to the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">6. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, including any requests to exercise your legal rights, please contact us at support@centxo.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
