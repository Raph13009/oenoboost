import { LEGAL_HOSTING, LEGAL_PUBLISHER } from "./constants";
import type { LegalDocument } from "./types";

const contactEmail = LEGAL_PUBLISHER.email;
const address = LEGAL_PUBLISHER.addressSingleLine;

export const legalEn = {
  navMentions: "Legal notice",
  navCgv: "Terms",
  navPrivacy: "Privacy",
  backHome: "Home",
  homeCta: "Back to OenoBoost",
  brandSub: "Legal information",
  tocLabel: "Contents",
  contactLabel: "Contact",
  exploreLabel: "Explore",
  signupNotice:
    "By creating an account, you agree to the {{mentions}} and the {{privacy}}.",
  signupMentionsLabel: "legal notice",
  signupPrivacyLabel: "privacy policy",
  paywallLegal:
    "By upgrading to Premium, you agree to the {{cgv}} and the {{privacy}}.",
  paywallCgvLabel: "Terms",
  paywallPrivacyLabel: "privacy policy",
  documents: {
    mentions: {
      slug: "mentions-legales",
      title: "Legal notice",
      lastUpdatedLabel: "Last updated: November 2026",
      sections: [
        {
          heading: "Publisher",
          paragraphs: [
            `The ${LEGAL_PUBLISHER.siteName} website (the “Service”) is published by ${LEGAL_PUBLISHER.name}, a natural person.`,
            `Address: ${address}.`,
            `Contact: ${contactEmail}.`,
            "As of today, no SIREN / SIRET number is provided: no company has yet been incorporated for publishing this Service. This notice will be updated once a legal entity is formalised.",
          ],
        },
        {
          heading: "Publication director",
          paragraphs: [
            `The publication director is ${LEGAL_PUBLISHER.name}.`,
          ],
        },
        {
          heading: "Hosting",
          paragraphs: [
            `The Service is hosted by ${LEGAL_HOSTING.name}, ${LEGAL_HOSTING.address}. Website: ${LEGAL_HOSTING.website}.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `For questions about the Service, this notice or your personal data: ${contactEmail}.`,
            `Publisher postal address: ${address}.`,
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "Editorial content, trademarks, logos, text, images, maps, quizzes and graphic elements on the Service are protected by intellectual property law.",
            "Unauthorised reproduction, representation, extraction or redistribution is prohibited, except for private non-commercial use within legal limits.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "OenoBoost provides educational wine content. Information is for informational purposes only and is not professional, medical, personalised oenological or legal advice.",
            "To the extent permitted by law, the publisher is not liable for indirect damages arising from use of the Service.",
            "Excessive alcohol consumption is dangerous for your health. Drink responsibly. The Service is intended for adults.",
          ],
        },
        {
          heading: "Personal data",
          paragraphs: [
            `Personal data processing is described in the privacy policy available on the Service. To exercise your rights: ${contactEmail}.`,
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "This notice is governed by French law. French courts have jurisdiction, subject to mandatory consumer protections.",
          ],
        },
      ],
    } satisfies LegalDocument,
    cgv: {
      slug: "cgv",
      title: "Terms of sale and use",
      lastUpdatedLabel: "Last updated: November 2026",
      sections: [
        {
          heading: "Purpose",
          paragraphs: [
            `These terms govern access to and use of the ${LEGAL_PUBLISHER.siteName} Service, an educational wine platform (content, quizzes, tasting, Premium subscription).`,
            `Publisher: ${LEGAL_PUBLISHER.name}, ${address}, ${contactEmail}.`,
          ],
        },
        {
          heading: "User account",
          paragraphs: [
            "Registration requires an email address, password and first / last name. You are responsible for keeping your credentials confidential and for activity under your account.",
            "You agree to provide accurate information and to use the Service lawfully and in accordance with these terms.",
          ],
        },
        {
          heading: "Free and Premium plans",
          paragraphs: [
            "The Service offers a free plan with limited features, and a paid Premium plan with extended content and features (as described in the app).",
            "The Premium price shown in the app at checkout (currently EUR 9.99 incl. tax / month, subject to the price displayed) is the price applicable to your order.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Subscription payments are processed by Stripe on a Stripe-hosted checkout page. OenoBoost does not collect or store card numbers on its own servers.",
            "By subscribing, you also accept Stripe’s applicable payment terms.",
          ],
        },
        {
          heading: "Term, renewal and cancellation",
          paragraphs: [
            "Premium is sold as a recurring subscription (monthly unless otherwise stated at checkout) and renews automatically until cancelled.",
            "You may cancel from Profile (settings) or via the Stripe billing portal when available. Cancellation ends Premium access according to the Service’s technical rules; periods already billed are not automatically refunded unless required by law or otherwise decided by the publisher.",
          ],
        },
        {
          heading: "Withdrawal and refunds",
          paragraphs: [
            "For digital services supplied immediately after purchase, the right of withdrawal may be limited where you expressly requested immediate performance and acknowledged loss of that right, under applicable consumer law.",
            `For refund or commercial claims, contact ${contactEmail} with your account email. Requests are reviewed case by case, subject to applicable law.`,
          ],
        },
        {
          heading: "Availability and changes",
          paragraphs: [
            "The publisher aims to keep the Service available but does not guarantee uninterrupted access (maintenance, incidents, third-party dependencies).",
            "Features and content may evolve. Material changes to these terms will be reflected on this page and, where appropriate, communicated in-app.",
          ],
        },
        {
          heading: "Intellectual property and content use",
          paragraphs: [
            "Service content is for personal educational use. Mass extraction, resale, automated scraping or unauthorised redistribution is prohibited.",
          ],
        },
        {
          heading: "Prohibited behaviour",
          paragraphs: [
            "In particular, you must not:",
          ],
          bullets: [
            "Impersonate another person or create an account with clearly false information.",
            "Attempt to bypass free-plan limits or Premium access controls.",
            "Undermine the security, availability or integrity of the Service.",
            "Use the Service for unlawful purposes.",
          ],
        },
        {
          heading: "Force majeure",
          paragraphs: [
            "The publisher is not liable for delays or failures caused by force majeure or events beyond reasonable control (cloud-provider outage, network failure, etc.).",
          ],
        },
        {
          heading: "Personal data",
          paragraphs: [
            "How we process your data is described in the privacy policy, which forms part of your relationship with the Service.",
          ],
        },
        {
          heading: "Governing law and disputes",
          paragraphs: [
            "These terms are governed by French law.",
            `In case of dispute, contact ${contactEmail}. Failing amicable resolution, competent French courts may be seized, subject to mandatory consumer protections.`,
          ],
        },
      ],
    } satisfies LegalDocument,
    privacy: {
      slug: "confidentialite",
      title: "Privacy policy",
      lastUpdatedLabel: "Last updated: November 2026",
      sections: [
        {
          heading: "Data controller",
          paragraphs: [
            `${LEGAL_PUBLISHER.name}, natural person, ${address}.`,
            `Contact for privacy questions and to exercise your rights: ${contactEmail}.`,
          ],
        },
        {
          heading: "Data we collect",
          paragraphs: [
            "Depending on how you use the Service, we may process:",
          ],
          bullets: [
            "Account data: email, first name, last name, password (hashed by the auth provider), language preference, plan (free / Premium), progression (level, XP).",
            "Learning activity: favourites, quiz sessions and answers, daily question log, private AOP notes (if Premium), saved tasting sheets.",
            "Subscription data: Stripe IDs (customer / subscription / price), status and billing periods — no card number stored by OenoBoost.",
            "Technical data needed to run the Service: auth session cookies and a language preference cookie.",
          ],
        },
        {
          heading: "Purposes and legal bases",
          paragraphs: [
            "We process your data to:",
          ],
          bullets: [
            "Provide the account and Service (contract / pre-contractual steps).",
            "Manage Premium billing via Stripe (contract / legal retention duties where applicable).",
            "Secure the Service, prevent abuse and keep it stable (legitimate interest).",
            "Respond to your requests (rights, support) (legal obligation / legitimate interest).",
          ],
        },
        {
          heading: "Processors and recipients",
          paragraphs: [
            "Providers process data on our behalf or as independent controllers as applicable:",
          ],
          bullets: [
            "Supabase — authentication and database.",
            "Stripe — payments and subscriptions (card data stays with Stripe).",
            "Mapbox — interactive maps (client token; no OenoBoost user Mapbox account).",
            "Vercel — hosting and deployment infrastructure.",
          ],
        },
        {
          heading: "Cookies and similar technologies",
          paragraphs: [
            "The Service only uses essential cookies / storage:",
          ],
          bullets: [
            "Supabase session cookies (authentication).",
            "Language preference cookie (oenoboost-locale).",
            "Browser session storage for an in-progress tasting draft (not analytics).",
          ],
        },
        {
          heading: "No non-essential cookies today",
          paragraphs: [
            "No third-party marketing analytics tool is integrated today. Therefore no non-essential cookie consent banner is shown. If non-essential trackers are added later, an appropriate consent mechanism will be implemented.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Account and activity data are kept while the account is active, then handled upon a deletion request or prolonged inactivity according to operational needs.",
            "Billing and subscription data may be retained as long as required for accounting and tax duties, including by Stripe. Deleting an OenoBoost account does not erase Stripe payment archives or records required by law.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "Under the GDPR and French data-protection law, you may request access, rectification, erasure, restriction, portability (where applicable) and object to certain processing.",
            `To exercise these rights, email ${contactEmail} from (or stating) your account email. We respond within legal deadlines after identity verification.`,
            "You may also lodge a complaint with the CNIL (www.cnil.fr).",
          ],
        },
        {
          heading: "How to submit a request",
          paragraphs: [
            "To speed things up:",
          ],
          bullets: [
            "State clearly whether you want access, export, rectification or deletion.",
            "Include the OenoBoost account email concerned.",
            "Attach anything useful to verify you own the account.",
          ],
        },
        {
          heading: "Account deletion",
          paragraphs: [
            "From Profile → Settings → Delete my account, you can open a pre-filled email request.",
            "After confirmation, personal data linked to the account in OenoBoost (profile, tastings, favourites, quizzes, related notes) is intended to be deleted within 30 business days, subject to necessary checks.",
            "Billing / subscription records required by law or held by Stripe are not erased by this process.",
          ],
        },
        {
          heading: "Access and export",
          paragraphs: [
            `For an access or export request, contact ${contactEmail} stating the request type and account email. Self-serve export is not yet available in the app.`,
          ],
        },
        {
          heading: "Minors",
          paragraphs: [
            "The Service is intended for adults. If you believe an account was created by a minor, contact us so we can review the situation.",
          ],
        },
        {
          heading: "Security and transfers",
          paragraphs: [
            "We apply reasonable technical measures (professional hosting, authentication, access control). No system is perfectly secure.",
            "Some providers (including Vercel, Stripe, Mapbox, Supabase) may process data outside the EU under their own transfer mechanisms. Further detail is available on request.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "This policy may be updated to reflect Service or legal changes. The date at the top of the page is the reference.",
          ],
        },
      ],
    } satisfies LegalDocument,
  },
} as const;
