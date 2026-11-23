import Image from "next/image";
import Link from "next/link";

import { DegustationStartCta } from "@/features/degustation/components/degustation-start-cta";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerLocale } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  return {
    title: `${dict.degustation.title} — OenoBoost`,
    description: dict.degustation.subtitle,
  };
}

export default async function DegustationPage() {
  const dict = await getDictionary(await getServerLocale());
  const d = dict.degustation;
  const t = dict.tastingFlow;
  const user = await getCurrentUser();

  const steps = [
    { n: "01", title: t.epureStepVisual, sub: t.epureStepVisualSub },
    { n: "02", title: t.epureStepNose, sub: t.epureStepNoseSub },
    { n: "03", title: t.epureStepMouth, sub: t.epureStepMouthSub },
  ] as const;

  return (
    <div className="epure-page vs-bleed -mx-6 -mt-5 min-h-[calc(100dvh-3.5rem)] bg-[#f8f5ef] text-[#3b2c2b] lg:-mx-8">
      <section className="bg-[#352629]">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[1fr_620px]">
          <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-24 lg:py-[38px]">
            <p className="text-[11px] font-medium uppercase tracking-[2.1px] text-[#d5ba95]">
              {t.epureHeroEyebrow}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-[clamp(2.4rem,4.5vw,3.625rem)] font-normal leading-none text-[#fcf7f0]">
              {t.epureHeroTitle1}
            </h1>
            <p className="mt-1 font-[family-name:var(--font-cormorant)] text-[clamp(2.4rem,4.5vw,3.625rem)] font-normal italic leading-none text-[#fcf7f0]">
              {t.epureHeroTitle2}
            </p>
            <p className="mt-8 max-w-[480px] text-[15px] leading-normal text-[#ddcfca]">
              {d.subtitle}
            </p>
          </div>
          <div className="relative hidden h-[280px] lg:block">
            <Image
              src="/tasting/epure/hero-wine.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="620px"
            />
          </div>
          <div className="relative h-[160px] lg:hidden">
            <Image
              src="/tasting/epure/hero-wine.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[720px] flex-col px-6 py-12 sm:px-8 lg:px-0">
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex items-center gap-3 rounded-[8px] bg-white px-4 py-4 sm:flex-col sm:items-start sm:gap-2 sm:px-5 sm:py-5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eae4db] text-[12px] font-medium text-[#80746e]">
                {s.n}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-[#3b2c2b]">
                  {s.title}
                </p>
                <p className="mt-0.5 text-[12px] text-[#80716b]">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <DegustationStartCta
            isLoggedIn={user != null}
            ctaLabel={d.ctaStart}
            className="w-full max-w-sm"
            authCopy={{
              title: d.authModalTitle,
              body: d.authModalBody,
              login: dict.auth.login,
              register: dict.auth.registerButton,
            }}
          />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            <Link
              href="/degustation/oeil"
              className="text-[#65594f] underline-offset-2 hover:underline"
            >
              {d.howItWorks}
            </Link>
            <Link
              href="/degustation/history"
              className="text-[#752e42] underline-offset-2 hover:underline"
            >
              {dict.tastingHistory.title}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
