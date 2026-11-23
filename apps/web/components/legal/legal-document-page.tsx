import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Home } from "lucide-react";

import type { LegalBundle, LegalDocument } from "@/content/legal";
import { LEGAL_PUBLISHER } from "@/content/legal";

import { LegalToc } from "./legal-toc";
import "./legal.css";

type Props = {
  document: LegalDocument;
  bundle: LegalBundle;
  active: "mentions" | "cgv" | "privacy";
};

function sectionId(heading: string, index: number): string {
  const slug = heading
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `s-${index + 1}-${slug || "section"}`;
}

const TABS = [
  { key: "mentions" as const, href: "/mentions-legales", labelKey: "navMentions" as const },
  { key: "cgv" as const, href: "/cgv", labelKey: "navCgv" as const },
  { key: "privacy" as const, href: "/confidentialite", labelKey: "navPrivacy" as const },
];

export function LegalDocumentPage({ document, bundle, active }: Props) {
  const tocItems = document.sections.map((section, index) => ({
    id: sectionId(section.heading, index),
    label: section.heading,
  }));

  return (
    <div className="legal-shell">
      <header className="legal-topbar">
        <div className="legal-topbar-inner">
          <Link href="/" className="legal-brand" aria-label={bundle.backHome}>
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
            <span className="legal-brand-text">
              <strong>OenoBoost</strong>
              <small>{bundle.brandSub}</small>
            </span>
          </Link>
          <div className="legal-top-actions">
            <Link href="/" className="legal-home-btn">
              <Home className="size-3.5" aria-hidden />
              {bundle.backHome}
            </Link>
          </div>
        </div>
      </header>

      <div className="legal-hero">
        <p className="legal-hero-kicker">{bundle.brandSub}</p>
        <h1>{document.title}</h1>
        <p className="legal-hero-meta">{document.lastUpdatedLabel}</p>
      </div>

      <nav className="legal-tabs" aria-label={bundle.exploreLabel}>
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className="legal-tab"
            data-active={active === tab.key ? "true" : "false"}
            aria-current={active === tab.key ? "page" : undefined}
          >
            {bundle[tab.labelKey]}
          </Link>
        ))}
      </nav>

      <div className="legal-body">
        <LegalToc title={bundle.tocLabel} items={tocItems} />

        <article className="legal-article">
          {document.sections.map((section, index) => {
            const id = sectionId(section.heading, index);
            return (
              <section
                key={id}
                id={id}
                className="legal-section"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span className="legal-section-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 64)}>{p}</p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul>
                    {section.bullets.map((item) => (
                      <li key={item.slice(0, 64)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}

          <div className="legal-footer-cta">
            <p>{bundle.homeCta}</p>
            <Link href="/">
              {bundle.backHome}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="legal-bottom-nav">
            <Link href="/">
              <ArrowLeft className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              {bundle.backHome}
            </Link>
            {TABS.filter((t) => t.key !== active).map((tab) => (
              <Link key={tab.key} href={tab.href}>
                {bundle[tab.labelKey]}
              </Link>
            ))}
            <a href={`mailto:${LEGAL_PUBLISHER.email}`}>{bundle.contactLabel}</a>
          </div>
        </article>
      </div>
    </div>
  );
}
