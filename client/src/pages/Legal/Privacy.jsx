import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-bg bg-grid">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-text/60 hover:text-text transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 md:p-12 space-y-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-primary" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gradient">Privacy Policy</h1>
              <p className="text-text/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">1. Introduction</h2>
            <p className="text-text/70 leading-relaxed">
              NexPrompt ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">2. Information We Collect</h2>
            
            <div className="text-text/70 leading-relaxed space-y-3">
              <h3 className="font-medium text-text/90">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Profile Information:</strong> Optional avatar/profile picture</li>
                <li><strong>Payment Information:</strong> Processed securely through Razorpay (we do not store full card details)</li>
                <li><strong>Content:</strong> Prompts, conversations, templates, and favorites you create</li>
              </ul>

              <h3 className="font-medium text-text/90">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Usage Data:</strong> Features used, AI providers selected, generation frequency</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Log Data:</strong> Access times, pages viewed, errors encountered</li>
                <li><strong>Cookies:</strong> Session management and authentication tokens</li>
              </ul>

              <h3 className="font-medium text-text/90">2.3 Third-Party Data</h3>
              <p>
                When you use AI generation features, your prompts are sent to third-party AI providers 
                (Groq, SambaNova, Anthropic, OpenCode, Google Gemini). Each provider has their own 
                privacy policy governing how they handle data.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">3. How We Use Your Information</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>We use collected information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process payments and manage your credit balance</li>
                <li>Generate and optimize prompts using AI providers</li>
                <li>Send service-related notifications and updates</li>
                <li>Respond to your support requests and inquiries</li>
                <li>Monitor usage patterns and prevent abuse</li>
                <li>Comply with legal obligations and enforce our Terms</li>
                <li>Analyze service performance and user behavior</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">4. Data Sharing & Disclosure</h2>
            
            <div className="text-text/70 leading-relaxed space-y-3">
              <h3 className="font-medium text-text/90">4.1 Third-Party Service Providers</h3>
              <p>We share data with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>AI Providers:</strong> Groq, SambaNova, Anthropic, OpenCode, Google Gemini (for prompt generation)</li>
                <li><strong>Payment Processor:</strong> Razorpay (for payment processing)</li>
                <li><strong>Hosting Provider:</strong> For infrastructure and data storage</li>
              </ul>

              <h3 className="font-medium text-text/90">4.2 Legal Requirements</h3>
              <p>We may disclose your information if required to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Comply with legal obligations or court orders</li>
                <li>Protect our rights, property, or safety</li>
                <li>Prevent fraud or security threats</li>
                <li>Enforce our Terms and Conditions</li>
              </ul>

              <h3 className="font-medium text-text/90">4.3 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be 
                transferred to the acquiring entity. We will notify you of any such change.
              </p>

              <h3 className="font-medium text-text/90">4.4 What We Don't Do</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We do NOT sell your personal information to third parties</li>
                <li>We do NOT share your prompts publicly without your consent</li>
                <li>We do NOT use your content to train our own AI models</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">5. Data Security</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>We implement industry-standard security measures including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encrypted password storage using bcrypt</li>
                <li>Secure authentication with JWT tokens</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
                <li>Secure payment processing through PCI-compliant providers</li>
              </ul>
              <p className="mt-3">
                However, no method of transmission over the internet is 100% secure. While we strive to 
                protect your data, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">6. Data Retention</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Prompts & Conversations:</strong> Stored indefinitely unless you delete them</li>
                <li><strong>Payment Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Usage Logs:</strong> Retained for 90 days for security and analytics</li>
                <li><strong>Deleted Data:</strong> Permanently removed within 30 days of deletion request</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">7. Your Privacy Rights</h2>
            <div className="text-text/70 leading-relaxed space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your prompts and conversations</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Object:</strong> Object to certain data processing activities</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at privacy@nexprompt.site or use the Settings 
                page in your account.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">8. Cookies & Tracking</h2>
            <div className="text-text/70 leading-relaxed space-y-3">
              <h3 className="font-medium text-text/90">8.1 Essential Cookies</h3>
              <p>
                We use essential cookies for authentication and session management. These are necessary 
                for the Service to function and cannot be disabled.
              </p>

              <h3 className="font-medium text-text/90">8.2 Analytics</h3>
              <p>
                We may use analytics tools to understand how users interact with our Service. You can 
                opt out of analytics tracking through your browser settings.
              </p>

              <h3 className="font-medium text-text/90">8.3 Local Storage</h3>
              <p>
                We use browser local storage to save your preferences (theme, sidebar state) and 
                authentication tokens for a better user experience.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">9. Third-Party Links</h2>
            <p className="text-text/70 leading-relaxed">
              Our Service may contain links to third-party websites or services. We are not responsible 
              for the privacy practices of these external sites. We encourage you to review their privacy 
              policies before providing any personal information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">10. Children's Privacy</h2>
            <p className="text-text/70 leading-relaxed">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a 
              child, please contact us immediately and we will delete it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">11. International Data Transfers</h2>
            <p className="text-text/70 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country 
              of residence. These countries may have different data protection laws. By using our Service, 
              you consent to such transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">12. Changes to This Policy</h2>
            <p className="text-text/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes 
              via email or through a prominent notice on our Service. Your continued use after changes 
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">13. Contact Us</h2>
            <p className="text-text/70 leading-relaxed">
              For questions about this Privacy Policy or to exercise your privacy rights, contact us at:
            </p>
            <div className="text-text/70 bg-black/30 rounded-lg p-4 space-y-1">
              <p>Email: privacy@nexprompt.site</p>
              <p>Support: support@nexprompt.site</p>
              <p>Data Protection Officer: dpo@nexprompt.site</p>
            </div>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-text/50 text-sm text-center">
              By using NexPrompt, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
