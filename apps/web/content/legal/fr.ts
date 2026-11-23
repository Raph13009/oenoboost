import { LEGAL_HOSTING, LEGAL_PUBLISHER } from "./constants";
import type { LegalDocument } from "./types";

const contactEmail = LEGAL_PUBLISHER.email;
const address = LEGAL_PUBLISHER.addressSingleLine;

export const legalFr = {
  navMentions: "Mentions légales",
  navCgv: "CGV",
  navPrivacy: "Confidentialité",
  backHome: "Accueil",
  homeCta: "Retourner sur OenoBoost",
  brandSub: "Informations légales",
  tocLabel: "Sommaire",
  contactLabel: "Contact",
  exploreLabel: "Explorer",
  signupNotice:
    "En créant un compte, vous acceptez les {{mentions}} et la {{privacy}}.",
  signupMentionsLabel: "mentions légales",
  signupPrivacyLabel: "politique de confidentialité",
  paywallLegal:
    "En passant à Premium, vous acceptez les {{cgv}} et la {{privacy}}.",
  paywallCgvLabel: "CGV",
  paywallPrivacyLabel: "politique de confidentialité",
  documents: {
    mentions: {
      slug: "mentions-legales",
      title: "Mentions légales",
      lastUpdatedLabel: "Dernière mise à jour : novembre 2026",
      sections: [
        {
          heading: "Éditeur du site",
          paragraphs: [
            `Le site ${LEGAL_PUBLISHER.siteName} (ci-après « le Service ») est édité par ${LEGAL_PUBLISHER.name}, personne physique.`,
            `Adresse : ${address}.`,
            `Contact : ${contactEmail}.`,
            "À ce jour, l'éditrice n'a pas de numéro SIREN / SIRET communiqué : aucune société n'est encore immatriculée pour l'édition de ce Service. Cette mention sera mise à jour dès qu'une structure juridique sera formalisée.",
          ],
        },
        {
          heading: "Directeur de la publication",
          paragraphs: [
            `Le directeur de la publication est ${LEGAL_PUBLISHER.name}.`,
          ],
        },
        {
          heading: "Hébergement",
          paragraphs: [
            `Le Service est hébergé par ${LEGAL_HOSTING.name}, ${LEGAL_HOSTING.address}. Site : ${LEGAL_HOSTING.website}.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `Pour toute question relative au Service, aux présentes mentions ou à vos données personnelles : ${contactEmail}.`,
            `Adresse postale de l'éditrice : ${address}.`,
          ],
        },
        {
          heading: "Propriété intellectuelle",
          paragraphs: [
            "Les contenus éditoriaux, marques, logos, textes, images, cartes, quiz et éléments graphiques présents sur le Service sont protégés par le droit de la propriété intellectuelle.",
            "Toute reproduction, représentation, extraction ou redistribution non autorisée est interdite, sauf usage privé et non commercial dans les limites légales.",
          ],
        },
        {
          heading: "Responsabilité",
          paragraphs: [
            "OenoBoost propose des contenus éducatifs sur le vin. Les informations sont fournies à titre informatif et ne constituent pas un conseil professionnel, médical, œnologique personnalisé ou juridique.",
            "L'éditrice ne saurait être tenue responsable des dommages indirects liés à l'utilisation du Service, dans les limites permises par la loi.",
            "L'abus d'alcool est dangereux pour la santé. À consommer avec modération. Le Service s'adresse à un public majeur.",
          ],
        },
        {
          heading: "Données personnelles",
          paragraphs: [
            `Le traitement des données personnelles est décrit dans la politique de confidentialité accessible depuis le Service. Pour exercer vos droits : ${contactEmail}.`,
          ],
        },
        {
          heading: "Droit applicable",
          paragraphs: [
            "Les présentes mentions sont régies par le droit français. Les tribunaux français sont compétents, sous réserve des règles protectrices applicables aux consommateurs.",
          ],
        },
      ],
    } satisfies LegalDocument,
    cgv: {
      slug: "cgv",
      title: "Conditions générales de vente et d'utilisation",
      lastUpdatedLabel: "Dernière mise à jour : novembre 2026",
      sections: [
        {
          heading: "Objet",
          paragraphs: [
            `Les présentes conditions régissent l'accès et l'utilisation du Service ${LEGAL_PUBLISHER.siteName}, plateforme éducative sur le vin (contenus, quiz, dégustation, abonnement Premium).`,
            `Éditrice : ${LEGAL_PUBLISHER.name}, ${address}, ${contactEmail}.`,
          ],
        },
        {
          heading: "Compte utilisateur",
          paragraphs: [
            "L'inscription nécessite une adresse e-mail, un mot de passe et un prénom / nom. Vous êtes responsable de la confidentialité de vos identifiants et des activités réalisées via votre compte.",
            "Vous vous engagez à fournir des informations exactes et à utiliser le Service conformément à la loi et aux présentes conditions.",
          ],
        },
        {
          heading: "Offres free et Premium",
          paragraphs: [
            "Le Service propose un accès gratuit (offre free) avec des fonctionnalités limitées, et une offre Premium payante donnant accès à des contenus et fonctionnalités étendus (notamment fiches et outils décrits dans l'application).",
            "Le prix de l'abonnement Premium affiché dans l'application au moment de la souscription (actuellement 9,99 € TTC / mois, sous réserve de mise à jour affichée) fait foi pour la commande.",
          ],
        },
        {
          heading: "Paiement",
          paragraphs: [
            "Les paiements d'abonnement sont traités par Stripe via une page de paiement hébergée par Stripe. OenoBoost ne collecte ni ne stocke les numéros de carte bancaire sur ses propres serveurs.",
            "En souscrivant, vous acceptez également les conditions de Stripe applicables au paiement.",
          ],
        },
        {
          heading: "Durée, renouvellement et résiliation",
          paragraphs: [
            "L'abonnement Premium est souscrit pour une période récurrente (mensuelle sauf indication contraire au moment du paiement) et se renouvelle automatiquement tant qu'il n'est pas résilié.",
            "Vous pouvez résilier depuis votre Profil (réglages) ou via le portail de facturation Stripe lorsqu'il est mis à disposition. La résiliation met fin à l'accès Premium selon les règles techniques du Service ; les périodes déjà facturées ne sont pas automatiquement remboursées sauf obligation légale ou décision contraire de l'éditrice.",
          ],
        },
        {
          heading: "Droit de rétractation et remboursements",
          paragraphs: [
            "Pour les services numériques fournis immédiatement après souscription, le droit de rétractation peut être limité lorsque vous avez expressément demandé l'exécution immédiate et reconnu perdre ce droit, dans les conditions prévues par le droit de la consommation applicable.",
            `Pour toute demande relative à un remboursement ou à une réclamation commerciale, contactez ${contactEmail} en précisant l'adresse e-mail du compte. Chaque demande est examinée au cas par cas, dans le respect des obligations légales applicables.`,
          ],
        },
        {
          heading: "Disponibilité et évolution du Service",
          paragraphs: [
            "L'éditrice s'efforce d'assurer la disponibilité du Service mais ne garantit pas une absence d'interruptions (maintenance, incidents techniques, dépendances tierces).",
            "Les fonctionnalités et contenus peuvent évoluer. Les changements substantiels des présentes conditions seront portés à votre connaissance par une mise à jour de cette page et, le cas échéant, une information in-app.",
          ],
        },
        {
          heading: "Propriété intellectuelle et usage du contenu",
          paragraphs: [
            "Les contenus du Service sont destinés à un usage personnel et éducatif. Toute extraction massive, revente, scraping automatisé ou redistribution non autorisée est interdite.",
          ],
        },
        {
          heading: "Comportements interdits",
          paragraphs: [
            "Il est notamment interdit de :",
          ],
          bullets: [
            "Usurper l'identité d'un tiers ou créer un compte avec des informations manifestement fausses.",
            "Tenter de contourner les limitations de l'offre free ou les contrôles d'accès Premium.",
            "Porter atteinte à la sécurité, à la disponibilité ou à l'intégrité du Service.",
            "Utiliser le Service à des fins illicites.",
          ],
        },
        {
          heading: "Force majeure",
          paragraphs: [
            "L'éditrice n'est pas responsable des retards ou défaillances dus à un événement de force majeure ou à des incidents hors de son contrôle raisonnable (panne d'un prestataire cloud, coupure réseau, etc.).",
          ],
        },
        {
          heading: "Données personnelles",
          paragraphs: [
            "Le traitement de vos données est décrit dans la politique de confidentialité, qui fait partie intégrante de votre relation avec le Service.",
          ],
        },
        {
          heading: "Droit applicable et litiges",
          paragraphs: [
            "Les présentes conditions sont régies par le droit français.",
            `En cas de litige, vous pouvez contacter ${contactEmail}. À défaut de résolution amiable, les tribunaux français compétents pourront être saisis, sous réserve des règles protectrices applicables aux consommateurs.`,
          ],
        },
      ],
    } satisfies LegalDocument,
    privacy: {
      slug: "confidentialite",
      title: "Politique de confidentialité",
      lastUpdatedLabel: "Dernière mise à jour : novembre 2026",
      sections: [
        {
          heading: "Responsable du traitement",
          paragraphs: [
            `${LEGAL_PUBLISHER.name}, personne physique, ${address}.`,
            `Contact pour toute question relative aux données personnelles et pour exercer vos droits : ${contactEmail}.`,
          ],
        },
        {
          heading: "Données collectées",
          paragraphs: [
            "Selon votre usage du Service, nous pouvons traiter :",
          ],
          bullets: [
            "Données de compte : e-mail, prénom, nom, mot de passe (hash géré par le prestataire d'authentification), préférences de langue, plan (free / Premium), progression (niveau, XP).",
            "Données d'activité pédagogique : favoris, sessions et réponses de quiz, journal de questions du jour, notes AOP privées (si Premium), fiches de dégustation enregistrées.",
            "Données d'abonnement : identifiants Stripe (client / abonnement / prix), statut et périodes d'abonnement — pas de numéro de carte stocké par OenoBoost.",
            "Données techniques nécessaires au fonctionnement : cookies de session d'authentification et cookie de langue.",
          ],
        },
        {
          heading: "Finalités et bases légales",
          paragraphs: [
            "Nous traitons vos données pour :",
          ],
          bullets: [
            "Fournir le compte et le Service (exécution du contrat / mesures précontractuelles).",
            "Gérer l'abonnement Premium et la facturation via Stripe (exécution du contrat / obligations légales de conservation comptable le cas échéant).",
            "Assurer la sécurité, prévenir les abus et améliorer la stabilité technique (intérêt légitime).",
            "Répondre à vos demandes (droits, support) (obligation légale / intérêt légitime).",
          ],
        },
        {
          heading: "Sous-traitants et destinataires",
          paragraphs: [
            "Des prestataires traitent des données pour notre compte ou en tant que responsables distincts selon le cas :",
          ],
          bullets: [
            "Supabase — authentification et base de données.",
            "Stripe — paiement et abonnements (les données de carte restent chez Stripe).",
            "Mapbox — affichage de cartes interactives (jeton côté client ; pas de compte Mapbox utilisateur OenoBoost).",
            "Vercel — hébergement et infrastructure de déploiement.",
          ],
        },
        {
          heading: "Cookies et traceurs",
          paragraphs: [
            "Le Service utilise uniquement des cookies / stockages essentiels au fonctionnement :",
          ],
          bullets: [
            "Cookies de session Supabase (authentification).",
            "Cookie de préférence de langue (oenoboost-locale).",
            "Stockage de session navigateur pour un brouillon de dégustation en cours (non analytique).",
          ],
        },
        {
          heading: "Absence de cookies non essentiels",
          paragraphs: [
            "Aucun outil d'analytics marketing tiers n'est intégré à ce jour. En conséquence, aucun bandeau de consentement « cookies non essentiels » n'est affiché. Si des traceurs non essentiels sont ajoutés ultérieurement, un mécanisme de consentement adapté sera mis en place.",
          ],
        },
        {
          heading: "Durées de conservation",
          paragraphs: [
            "Les données de compte et d'activité sont conservées tant que le compte est actif, puis traitées dans le cadre d'une demande de suppression ou d'inactivité prolongée selon les besoins opérationnels.",
            "Les données relatives à la facturation et à l'abonnement peuvent être conservées aussi longtemps que nécessaire aux obligations comptables et fiscales, y compris chez Stripe. La suppression du compte OenoBoost n'entraîne pas l'effacement des écritures comptables ou archives de paiement conservées par Stripe ou imposées par la loi.",
          ],
        },
        {
          heading: "Vos droits",
          paragraphs: [
            "Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez demander l'accès, la rectification, l'effacement, la limitation, la portabilité (lorsque applicable) et vous opposer à certains traitements.",
            `Pour exercer ces droits, écrivez à ${contactEmail} depuis (ou en indiquant) l'adresse e-mail de votre compte. Nous répondons dans les délais légaux après vérification de votre identité.`,
            "Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).",
          ],
        },
        {
          heading: "Comment exercer une demande",
          paragraphs: [
            "Pour accélérer le traitement :",
          ],
          bullets: [
            "Indiquez clairement s'il s'agit d'un accès, d'un export, d'une rectification ou d'une suppression.",
            "Précisez l'adresse e-mail du compte OenoBoost concerné.",
            "Joignez tout élément utile pour vérifier que vous êtes bien le titulaire du compte.",
          ],
        },
        {
          heading: "Suppression de compte",
          paragraphs: [
            "Depuis Profil → Réglages → Supprimer mon compte, vous pouvez ouvrir une demande par e-mail préremplie.",
            "Après confirmation, les données personnelles liées au compte dans OenoBoost (profil, dégustations, favoris, quiz, notes associées) sont destinées à être supprimées sous 30 jours ouvrés, sous réserve des vérifications nécessaires.",
            "Les enregistrements de facturation / abonnement nécessaires aux obligations légales ou détenus par Stripe ne sont pas effacés par cette procédure.",
          ],
        },
        {
          heading: "Accès et export",
          paragraphs: [
            `Pour une demande d'accès ou d'export de vos données, contactez ${contactEmail} en précisant l'objet de la demande et l'e-mail du compte. Un export self-service n'est pas encore disponible dans l'application.`,
          ],
        },
        {
          heading: "Mineurs",
          paragraphs: [
            "Le Service est destiné à un public majeur. Si vous pensez qu'un compte a été créé par un mineur, contactez-nous afin que nous puissions examiner la situation.",
          ],
        },
        {
          heading: "Sécurité et transferts",
          paragraphs: [
            "Nous mettons en œuvre des mesures techniques raisonnables (hébergement professionnel, authentification, contrôle d'accès). Aucun système n'est parfaitement sécurisé.",
            "Certains prestataires (notamment Vercel, Stripe, Mapbox, Supabase) peuvent traiter des données hors UE selon leurs propres engagements (clauses contractuelles types / mécanismes de transfert). Des précisions peuvent être obtenues sur demande.",
          ],
        },
        {
          heading: "Modifications",
          paragraphs: [
            "Cette politique peut être mise à jour pour refléter l'évolution du Service ou de la réglementation. La date indiquée en tête de page fait référence.",
          ],
        },
      ],
    } satisfies LegalDocument,
  },
} as const;
