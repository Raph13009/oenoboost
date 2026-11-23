import Link from "next/link";

type LinkPart = {
  href: string;
  label: string;
};

type Props = {
  /** Template with {{key}} placeholders matching `links` keys. */
  template: string;
  links: Record<string, LinkPart>;
  className?: string;
};

/**
 * Renders a legal notice string with inline links replacing {{placeholders}}.
 */
export function LegalInlineNotice({ template, links, className }: Props) {
  const parts = template.split(/(\{\{[a-z]+\}\})/g);

  return (
    <p className={className ?? "text-center text-xs leading-relaxed text-muted-foreground"}>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([a-z]+)\}\}$/);
        if (!match) return <span key={i}>{part}</span>;
        const key = match[1];
        const link = links[key];
        if (!link) return <span key={i}>{part}</span>;
        return (
          <Link
            key={i}
            href={link.href}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {link.label}
          </Link>
        );
      })}
    </p>
  );
}
