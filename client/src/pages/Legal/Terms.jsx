import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
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
            <FileText className="text-primary" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gradient">Terms and Conditions</h1>
              <p className="text-text/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">1. Acceptance of Terms</h2>
            <p className="text-text/70 leading-relaxed">
              By accessing or using NexPrompt ("Service"), you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">2. Service Description</h2>
            <p className="text-text/70 leading-relaxed">
              NexPrompt is an AI-powered prompt generation and optimization platform that helps users create 
              effective prompts for various AI models. We provide access to multiple AI providers including 
              Groq, SambaNova, Anthropic, OpenCode, and Google Gemini.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">3. Account Registration</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>To use our Service, you must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your password</li>
                <li>Be at least 18 years of age or have parental consent</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">4. Credit System & Billing</h2>
            <div className="text-text/70 leading-relaxed space-y-3">
              <h3 className="font-medium text-text/90">4.1 Credit Packs</h3>
              <p>
                NexPrompt operates on a credit-based system. Credits are purchased through credit packs 
                and are consumed when generating or optimizing prompts. Different AI providers may consume 
                different amounts of credits per request.
              </p>
              
              <h3 className="font-medium text-text/90">4.2 Payment Terms</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All prices are listed in Indian Rupees (INR)</li>
                <li>Payments are processed securely through Razorpay</li>
                <li>Credits are non-refundable once purchased</li>
                <li>Credits do not expire unless your account is terminated</li>
                <li>We reserve the right to modify pricing with 30 days notice</li>
              </ul>

              <h3 className="font-medium text-text/90">4.3 Refund Policy</h3>
              <p>
                Due to the digital nature of our service, credits are generally non-refundable. However, 
                we may issue refunds at our discretion in cases of technical errors, duplicate charges, 
                or service unavailability. Refund requests must be submitted within 7 days of purchase.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">5. Acceptable Use Policy</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>You agree NOT to use the Service to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Generate content that is illegal, harmful, or violates third-party rights</li>
                <li>Create prompts for malicious purposes including phishing, spam, or malware</li>
                <li>Attempt to reverse engineer or compromise our systems</li>
                <li>Share your account credentials with others</li>
                <li>Resell or redistribute our Service without authorization</li>
                <li>Generate content that infringes intellectual property rights</li>
                <li>Create prompts that promote hate speech, violence, or discrimination</li>
                <li>Abuse rate limits or attempt to overload our systems</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">6. Content Ownership & License</h2>
            <div className="text-text/70 leading-relaxed space-y-3">
              <h3 className="font-medium text-text/90">6.1 Your Content</h3>
              <p>
                You retain all ownership rights to the prompts and content you create using NexPrompt. 
                By using our Service, you grant us a limited license to store, process, and display your 
                content solely for the purpose of providing the Service.
              </p>
              
              <h3 className="font-medium text-text/90">6.2 Platform Content</h3>
              <p>
                All templates, UI elements, documentation, and other materials provided by NexPrompt 
                remain our intellectual property. You may not copy, modify, or redistribute these materials 
                without our written permission.
              </p>

              <h3 className="font-medium text-text/90">6.3 AI-Generated Content</h3>
              <p>
                Content generated by AI providers through our Service is subject to the respective provider's 
                terms. We make no claims of ownership over AI-generated outputs.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">7. Service Availability & Limitations</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>We strive to provide reliable service, but:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We do not guarantee 100% uptime or availability</li>
                <li>AI provider availability may vary and is beyond our control</li>
                <li>We may perform maintenance that temporarily interrupts service</li>
                <li>Rate limits apply to prevent abuse (100 requests per 15 minutes, 10 streaming generations per minute)</li>
                <li>We reserve the right to modify or discontinue features with notice</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">8. Data Retention & Deletion</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>We retain your account data as long as your account is active</li>
                <li>You may request account deletion at any time through Settings</li>
                <li>Upon deletion, your data will be permanently removed within 30 days</li>
                <li>Backup copies may persist for up to 90 days for disaster recovery</li>
                <li>We may retain certain data as required by law or for legitimate business purposes</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">9. Limitation of Liability</h2>
            <p className="text-text/70 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXPROMPT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
              INTANGIBLE LOSSES RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE SERVICE; (B) ANY 
              UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS; (C) ANY INTERRUPTION OR CESSATION OF THE SERVICE; 
              (D) ANY BUGS, VIRUSES, OR OTHER HARMFUL CODE; (E) ANY CONTENT OR DATA GENERATED BY AI PROVIDERS; 
              OR (F) ANY ERRORS OR OMISSIONS IN ANY CONTENT.
            </p>
            <p className="text-text/70 leading-relaxed">
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">10. Disclaimer of Warranties</h2>
            <p className="text-text/70 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE 
              WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">11. Termination</h2>
            <div className="text-text/70 leading-relaxed space-y-2">
              <p>We may suspend or terminate your account if you:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violate these Terms and Conditions</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Abuse the Service or harm other users</li>
                <li>Fail to pay for services rendered</li>
              </ul>
              <p className="mt-3">
                Upon termination, your right to use the Service will immediately cease. Unused credits 
                are forfeited upon termination for cause.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">12. Modifications to Terms</h2>
            <p className="text-text/70 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material 
              changes via email or through the Service. Your continued use of the Service after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">13. Governing Law & Dispute Resolution</h2>
            <p className="text-text/70 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes arising from these Terms or your use of the Service shall be subject to 
              the exclusive jurisdiction of the courts in [Your City], India.
            </p>
            <p className="text-text/70 leading-relaxed">
              Before filing any legal action, you agree to attempt to resolve disputes through good 
              faith negotiation for at least 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">14. Indemnification</h2>
            <p className="text-text/70 leading-relaxed">
              You agree to indemnify and hold harmless NexPrompt, its affiliates, officers, directors, 
              employees, and agents from any claims, damages, losses, liabilities, and expenses (including 
              legal fees) arising from: (a) your use of the Service; (b) your violation of these Terms; 
              (c) your violation of any third-party rights; or (d) any content you submit through the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">15. Contact Information</h2>
            <p className="text-text/70 leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <div className="text-text/70 bg-black/30 rounded-lg p-4 space-y-1">
              <p>Email: legal@nexprompt.site</p>
              <p>Support: support@nexprompt.site</p>
            </div>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-text/50 text-sm text-center">
              By using NexPrompt, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
