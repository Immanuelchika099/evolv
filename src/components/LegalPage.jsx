import { ChevronLeft } from 'lucide-react'
import './LegalPage.css'

const legalContent = {
  terms: {
    title: 'Terms of Service',
    intro: 'These Terms explain the rules for using EVOLV. By creating an account or using the service, you agree to these Terms. If you do not agree, please do not use EVOLV.',
    sections: [
      ['1. About EVOLV', 'EVOLV is an AI-powered productivity app that helps you organise goals, understand routines, reflect on progress, and plan next steps. Features may change as the product develops.'],
      ['2. Eligibility and accounts', 'You must be legally able to enter into an agreement under the laws that apply to you. Keep your account information accurate and your sign-in credentials secure. Tell us promptly if you suspect unauthorised access. You are responsible for activity carried out through your account.'],
      ['3. AI is not professional advice', 'EVOLV may use AI to generate chat responses, summaries, suggestions, and insights. AI output can be inaccurate, incomplete, or unsuitable for your circumstances. Treat it as general productivity and self-reflection support, not medical, mental-health, legal, financial, or other professional advice. Use your own judgement and seek a qualified professional when appropriate. EVOLV is not an emergency or crisis service.'],
      ['4. Your content', 'You are responsible for the information, notes, goals, reflections, and other content you choose to enter. Do not submit information you do not have the right to share. Do not rely on EVOLV as the sole place to keep important records or as a substitute for professional support.'],
      ['5. Acceptable use', 'You agree not to use EVOLV unlawfully; attempt to access another person’s account or data; interfere with the service or its security; reverse engineer or scrape the service except where applicable law permits; or upload content that infringes another person’s rights. We may restrict access where reasonably necessary to protect users, the service, or legal compliance.'],
      ['6. Intellectual property', 'EVOLV and its original branding, interface, software, and service materials are owned by EVOLV or its licensors and are protected by applicable laws. We grant you a limited, personal, non-exclusive, non-transferable right to use the service for its intended purpose. You retain rights to content you provide, subject to the permissions needed to operate the service.'],
      ['7. Availability and changes', 'We work to keep EVOLV useful and available, but cannot promise uninterrupted or error-free operation. We may update, suspend, or discontinue features for operational, security, or product reasons. Where required by law, we will provide notice of material changes.'],
      ['8. Third-party services', 'Some features depend on third-party providers, including authentication, hosting, database, or AI services. Those services may be governed by their own terms and privacy notices.'],
      ['9. Disclaimers and liability', 'To the extent permitted by law, EVOLV is provided on an “as available” basis, without guarantees that every feature or AI-generated result will be accurate, uninterrupted, or suitable for a particular purpose. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited. Subject to that, EVOLV will not be liable for indirect or consequential losses arising from use of the service.'],
      ['10. Suspension and termination', 'You may stop using EVOLV at any time. We may suspend or end access where you materially breach these Terms, create a security or legal risk, or where we discontinue the service, subject to applicable law. To ask about account or data deletion, contact us. Some information may need to be retained where the law requires it.'],
      ['11. Changes to these Terms', 'We may update these Terms as EVOLV evolves. The “Last Updated” date indicates the latest revision. If a change requires advance notice under applicable law, we will provide that notice.'],
      ['12. Contact', 'For questions about these Terms or EVOLV, contact imanwahmed367@gmail.com.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy describes how EVOLV may handle information when you use our app and related services. We aim to collect and use information for purposes connected to providing, maintaining, and improving the experience.',
    sections: [
      ['1. Information you provide', 'Depending on the features you use, this may include account details such as your email address; profile and onboarding choices; goals and milestones; routine, wellbeing, meal, spending, or other logs you choose to record; reflections and notes; messages sent to the AI assistant; and messages you send to us for support. Some of this information may be personal or sensitive in nature.'],
      ['2. Technical information', 'The service may process technical and operational information needed to run safely and reliably, such as device and browser details, application events, error diagnostics, and security logs. The precise information available can depend on your device, settings, and the features you use.'],
      ['3. How we use information', 'We use information to create and maintain your account; save and display goals, logs, and progress; personalise the app; respond to requests; provide AI-generated responses and insights; maintain security; troubleshoot problems; and operate and improve EVOLV.'],
      ['4. AI processing', 'When you use AI features, relevant prompts and context may be sent to the AI provider configured for EVOLV so it can generate a response. Do not include information you are not comfortable submitting for this purpose. Processing, retention, and use by that provider are also subject to the provider’s terms and privacy practices. AI output can be wrong and should not be treated as professional advice.'],
      ['5. Storage and service providers', 'EVOLV uses third-party infrastructure to support the app, including Supabase for account and application data and hosting/deployment services for delivery of the product. Information may be processed by providers acting on our behalf as needed to deliver their services. We do not sell your personal information.'],
      ['6. Sharing and disclosure', 'We do not sell personal information. We may share information with service providers needed to operate EVOLV, where you direct us to do so, to protect users and the service, or where disclosure is required by law. Providers may process information needed to perform their functions.'],
      ['7. Retention', 'We keep information for as long as reasonably needed to provide the service, maintain account records, resolve disputes, enforce agreements, and meet legal or security obligations. Retention periods can differ by data type and provider. Deletion may be subject to applicable legal requirements and technical limitations.'],
      ['8. Your choices and rights', 'Depending on where you live, you may have rights to request access to, correction of, deletion of, or a copy of personal information, and to object to or restrict certain processing. You can manage device notification permissions in your device settings. To make a privacy request, contact imanwahmed367@gmail.com. We may need to verify your identity before responding.'],
      ['9. Security', 'We use reasonable technical and organisational measures intended to protect information. No online service or storage system can be guaranteed completely secure, and we cannot promise unauthorised access will never occur.'],
      ['10. Children', 'EVOLV is not designed for children who are not legally permitted to use the service in their jurisdiction. If you believe a child has provided personal information inappropriately, contact us so we can review the request and take appropriate action.'],
      ['11. International processing', 'Our service providers may process information in countries other than the country where you live. Where applicable, we will take steps required by relevant data-protection law for such transfers.'],
      ['12. Changes to this Policy', 'We may update this Privacy Policy as EVOLV changes. We will revise the “Last Updated” date and provide additional notice when required by applicable law.'],
      ['13. Contact', 'For privacy questions or requests, contact imanwahmed367@gmail.com.'],
    ],
  },
}

export default function LegalPage({ documentType = 'terms', onBack }) {
  const document = legalContent[documentType] || legalContent.terms
  return (
    <section className="legal-page" aria-labelledby="legal-page-title">
      <div className="legal-page-inner">
        <button type="button" className="legal-back-button" onClick={onBack}>
          <ChevronLeft size={18} aria-hidden="true" /><span>Back</span>
        </button>
        <header className="legal-page-header">
          <span className="legal-eyebrow">LEGAL</span>
          <h1 id="legal-page-title">{document.title}</h1>
          <p className="legal-dates">Effective Date: 17 October 2026 <span aria-hidden="true">·</span> Last Updated: 17 October 2026</p>
          <p className="legal-intro">{document.intro}</p>
        </header>
        <div className="legal-sections">
          {document.sections.map(([heading, body]) => (
            <section className="legal-section" key={heading}>
              <h2>{heading}</h2><p>{body}</p>
            </section>
          ))}
        </div>
        <button type="button" className="legal-back-button legal-back-bottom" onClick={onBack}>
          <ChevronLeft size={18} aria-hidden="true" /><span>Back to EVOLV</span>
        </button>
      </div>
    </section>
  )
}
