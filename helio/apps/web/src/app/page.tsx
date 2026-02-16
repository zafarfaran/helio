"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  FadeUp,
  FadeIn,
  SlideIn,
  StaggerChildren,
  staggerItem,
  ParallaxLayer,
  AnimatedCounter,
  TiltCard,
  ScaleOnScroll,
  FloatingElement,
  MagneticButton,
  RevealMask,
} from "@/components/motion";
import { ThemeToggle } from "@/components/theme-provider";
import {
  HelioLogo,
  IconCalculator,
  IconShield,
  IconChart,
  IconLightbulb,
  IconArrowRight,
  IconUpload,
  IconMessage,
  IconTarget,
  IconZap,
} from "@/components/icons";

/* ═══════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════ */

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-xl"
      style={{ backgroundColor: "var(--nav-bg)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-slate-900 dark:text-white">
          <HelioLogo />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] font-light tracking-wide text-slate-500 dark:text-zinc-400">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#"
            className="hidden sm:block text-[13px] font-light text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </a>
          <Link
            href="/chat"
            className="text-[13px] font-normal bg-slate-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════ */

function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <FloatingElement amplitude={12} duration={5} className="absolute top-20 left-[15%]">
          <div className="orb w-[400px] h-[400px] bg-brand-300 dark:bg-brand-600" />
        </FloatingElement>
        <FloatingElement amplitude={10} duration={6} delay={1} className="absolute top-40 right-[10%]">
          <div className="orb w-[300px] h-[300px] bg-violet-300 dark:bg-violet-700" />
        </FloatingElement>
        <FloatingElement amplitude={8} duration={7} delay={2} className="absolute bottom-20 left-[40%]">
          <div className="orb w-[250px] h-[250px] bg-sky-200 dark:bg-sky-800" />
        </FloatingElement>
      </motion.div>

      <motion.div style={{ opacity }} className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Pill badge */}
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm text-[12px] font-light tracking-wide text-slate-500 dark:text-zinc-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
              Built for UK financial advisers
            </div>
          </FadeUp>

          {/* Headline */}
          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-extralight tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Tax planning,{" "}
              <span className="font-normal bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">
                reimagined
              </span>
            </h1>
          </FadeUp>

          {/* Subtitle */}
          <FadeUp delay={0.2}>
            <p className="mt-6 text-base md:text-lg font-light text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Helio analyses your client&apos;s tax position in real-time,
              identifies planning opportunities, and helps you deliver better
              outcomes — powered by AI.
            </p>
          </FadeUp>

          {/* CTAs */}
          <FadeUp delay={0.3}>
            <div className="mt-10 flex items-center justify-center gap-4">
              <MagneticButton>
                <Link
                  href="/chat"
                  className="group inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-normal px-6 py-3 rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30"
                >
                  Start free trial
                  <IconArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </MagneticButton>
              <a
                href="#features"
                className="text-sm font-light text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-3"
              >
                See how it works
              </a>
            </div>
          </FadeUp>
        </div>

        {/* Product mockup with parallax + tilt */}
        <FadeUp delay={0.5} className="mt-20 md:mt-28 max-w-5xl mx-auto">
          <TiltCard tiltDegree={3} className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-slate-300/30 dark:shadow-black/40 overflow-hidden glow-accent">
            <ProductPreview />
          </TiltCard>
        </FadeUp>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT PREVIEW (embedded mini dashboard)
   ═══════════════════════════════════════════════════ */

function ProductPreview() {
  return (
    <div className="flex h-[340px] md:h-[420px] text-[11px] md:text-xs">
      {/* Chat side */}
      <div className="w-[38%] border-r border-slate-100 dark:border-zinc-800 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-slate-700 dark:text-zinc-200">Sarah Mitchell</span>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          <PreviewBubbleAI text="I've analysed Sarah's 2025/26 position. Employment income of £145,000 with £32,500 in dividends. I've found 3 planning opportunities." />
          <PreviewBubbleUser text="What's the biggest tax saving available?" />
          <PreviewBubbleAI text="Pension contributions — she has £42,000 unused annual allowance. A full contribution could save up to £16,800 in tax." />
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3 py-2 text-slate-400 dark:text-zinc-500">
            Ask about your client...
          </div>
        </div>
      </div>

      {/* Dashboard side */}
      <div className="flex-1 bg-slate-50/50 dark:bg-zinc-950/50 p-4 md:p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700 dark:text-zinc-200 text-xs md:text-sm">Tax Summary — 2025/26</span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-light">Last updated just now</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <PreviewStatCard label="Total liability" value="£52,847" delta="+£3,200" negative />
          <PreviewStatCard label="Effective rate" value="27.0%" delta="+1.2%" negative />
          <PreviewStatCard label="Opportunities" value="3" delta="£16,800" />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 p-3 md:p-4 space-y-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">Allowances</span>
          <PreviewAllowanceBar label="Personal Allowance" pct={100} detail="Tapered to £0" />
          <PreviewAllowanceBar label="Pension AA" pct={30} detail="£42,000 remaining" />
          <PreviewAllowanceBar label="ISA" pct={0} detail="£20,000 remaining" />
          <PreviewAllowanceBar label="Dividend" pct={100} detail="£0 remaining" />
        </div>
      </div>
    </div>
  );
}

function PreviewBubbleAI({ text }: { text: string }) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-800 rounded-lg rounded-bl-sm p-2.5 text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
      {text}
    </div>
  );
}

function PreviewBubbleUser({ text }: { text: string }) {
  return (
    <div className="bg-brand-500 text-white rounded-lg rounded-br-sm p-2.5 ml-auto max-w-[85%] leading-relaxed font-light">
      {text}
    </div>
  );
}

function PreviewStatCard({ label, value, delta, negative }: { label: string; value: string; delta: string; negative?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 p-3">
      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-light">{label}</div>
      <div className="mt-1 text-sm md:text-base font-medium text-slate-900 dark:text-white font-mono tracking-tight">{value}</div>
      <div className={`mt-0.5 text-[10px] font-light ${negative ? "text-red-500" : "text-emerald-500"}`}>{delta}</div>
    </div>
  );
}

function PreviewAllowanceBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  const color = pct >= 100 ? "bg-red-400" : pct >= 60 ? "bg-amber-400" : pct > 0 ? "bg-brand-400" : "bg-slate-200 dark:bg-zinc-700";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-600 dark:text-zinc-300 font-light">{label}</span>
        <span className="text-slate-400 dark:text-zinc-500 font-light">{detail}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOGOS / SOCIAL PROOF — SVG firm logos + marquee
   ═══════════════════════════════════════════════════ */

/* Each firm gets a proper logo: unique mark + wordmark */

function LogoMeridian() {
  return (
    <svg viewBox="0 0 160 28" className="h-6 md:h-7" fill="currentColor">
      {/* Compass mark */}
      <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <line x1="14" y1="4" x2="14" y2="24" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
      {/* Wordmark */}
      <text x="34" y="18.5" fontSize="14" fontWeight="300" fontFamily="inherit" letterSpacing="0.06em">MERIDIAN</text>
    </svg>
  );
}

function LogoAshworth() {
  return (
    <svg viewBox="0 0 170 28" className="h-6 md:h-7" fill="currentColor">
      {/* Stylised A lettermark */}
      <polygon points="14,3 24,25 20.5,25 18,19 10,19 7.5,25 4,25" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="11" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.3" />
      {/* Wordmark */}
      <text x="33" y="18" fontSize="14" fontWeight="400" fontFamily="inherit" letterSpacing="-0.02em">Ashworth</text>
      <text x="107" y="18" fontSize="10" fontWeight="300" fontFamily="inherit" opacity="0.5" letterSpacing="0.01em">&amp; Partners</text>
    </svg>
  );
}

function LogoKingsford() {
  return (
    <svg viewBox="0 0 150 28" className="h-6 md:h-7" fill="currentColor">
      {/* Crown / chevron mark */}
      <polyline points="4,20 9,8 14,15 19,8 24,20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="22" x2="24" y2="22" stroke="currentColor" strokeWidth="1.3" />
      {/* Wordmark */}
      <text x="34" y="18" fontSize="13.5" fontWeight="500" fontFamily="inherit" letterSpacing="0.04em">KINGSFORD</text>
    </svg>
  );
}

function LogoThornbury() {
  return (
    <svg viewBox="0 0 160 28" className="h-6 md:h-7" fill="currentColor">
      {/* Abstract leaf / thorn */}
      <path d="M14,4 C14,4 24,10 24,18 C24,22 20,24 14,24 C8,24 4,22 4,18 C4,10 14,4 14,4Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14,8 L14,20" stroke="currentColor" strokeWidth="1" />
      <path d="M10,14 L14,11 L18,14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Wordmark */}
      <text x="34" y="18" fontSize="14" fontWeight="300" fontFamily="inherit" letterSpacing="0.01em">Thornbury</text>
    </svg>
  );
}

function LogoWavecrest() {
  return (
    <svg viewBox="0 0 156 28" className="h-6 md:h-7" fill="currentColor">
      {/* Wave mark */}
      <path d="M3,16 C6,10 10,10 13,16 C16,22 20,22 23,16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3,20 C6,14 10,14 13,20 C16,26 20,26 23,20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      {/* Wordmark */}
      <text x="33" y="18.5" fontSize="13" fontWeight="400" fontFamily="inherit" letterSpacing="0.03em">Wavecrest</text>
    </svg>
  );
}

function LogoPembridge() {
  return (
    <svg viewBox="0 0 160 28" className="h-6 md:h-7" fill="currentColor">
      {/* Bridge arch mark */}
      <path d="M3,22 L3,12 C3,6 10,3 14,3 C18,3 25,6 25,12 L25,22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="22" x2="10" y2="14" stroke="currentColor" strokeWidth="1.2" />
      <line x1="18" y1="22" x2="18" y2="14" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1" y1="22" x2="27" y2="22" stroke="currentColor" strokeWidth="1.3" />
      {/* Wordmark */}
      <text x="36" y="18" fontSize="13.5" fontWeight="300" fontFamily="inherit" letterSpacing="0.02em">Pembridge</text>
    </svg>
  );
}

function LogoCaldwell() {
  return (
    <svg viewBox="0 0 140 28" className="h-6 md:h-7" fill="currentColor">
      {/* Interlocking C mark */}
      <path d="M18,6 A10,10 0 0,0 8,16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10,22 A10,10 0 0,0 20,12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Wordmark */}
      <text x="30" y="18" fontSize="14" fontWeight="400" fontFamily="inherit" letterSpacing="-0.01em">Caldwell</text>
      <text x="97" y="18" fontSize="10" fontWeight="300" fontFamily="inherit" opacity="0.5">&amp; Co</text>
    </svg>
  );
}

const FIRM_LOGOS = [LogoMeridian, LogoAshworth, LogoKingsford, LogoThornbury, LogoWavecrest, LogoPembridge, LogoCaldwell];

function LogoCloud() {
  return (
    <FadeIn className="py-14 md:py-16 border-b border-slate-100 dark:border-zinc-800/50 overflow-hidden">
      <p className="text-[11px] font-light uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600 mb-8 text-center">
        Trusted by leading advisory firms
      </p>

      <div className="relative">
        {/* Edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-r from-white dark:from-[#09090b] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-l from-white dark:from-[#09090b] to-transparent pointer-events-none" />

        {/* Scrolling track */}
        <div className="marquee-track">
          {/* Two copies for seamless loop */}
          {[...FIRM_LOGOS, ...FIRM_LOGOS].map((Logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-7 md:px-10 text-slate-900 dark:text-white opacity-70 dark:opacity-50 hover:opacity-100 transition-opacity duration-300"
            >
              <Logo />
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════════════════════════════════
   FEATURES — interactive split layout
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  {
    id: "analysis",
    icon: <IconCalculator className="w-[18px] h-[18px]" />,
    title: "Real-time tax analysis",
    description: "Instant calculations across income tax, NICs, CGT, and IHT. Always current with 2025/26 rates and thresholds.",
  },
  {
    id: "allowances",
    icon: <IconShield className="w-[18px] h-[18px]" />,
    title: "Allowance tracking",
    description: "Monitor ISA, pension annual allowance, CGT exemption, and dividend allowances in one consolidated view.",
  },
  {
    id: "scenarios",
    icon: <IconChart className="w-[18px] h-[18px]" />,
    title: "Scenario modelling",
    description: "Model salary sacrifice, pension contributions, bed-and-ISA strategies, and dividend restructuring in seconds.",
  },
  {
    id: "observations",
    icon: <IconLightbulb className="w-[18px] h-[18px]" />,
    title: "Smart observations",
    description: "AI-identified planning opportunities ranked by impact. From HICBC exposure to personal allowance taper traps.",
  },
];

function Features() {
  const [active, setActive] = useState(0);

  return (
    <section id="features" className="py-24 md:py-32 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <FadeUp>
          <div className="max-w-xl mb-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-500 mb-4">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-[2.5rem] font-extralight tracking-tight text-slate-900 dark:text-white leading-tight">
              Everything you need,{" "}
              <span className="font-normal">nothing you don&apos;t</span>
            </h2>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* ── Feature list (left) ── */}
          <FadeUp className="md:col-span-5">
            <div className="space-y-1">
              {FEATURES.map((f, i) => {
                const isActive = active === i;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 group relative ${
                      isActive
                        ? "bg-slate-50 dark:bg-zinc-900"
                        : "hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                    }`}
                  >
                    {/* Active indicator bar */}
                    <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300 ${
                      isActive ? "bg-brand-500 opacity-100" : "bg-transparent opacity-0"
                    }`} />

                    <div className="flex items-start gap-3.5">
                      <span className={`mt-0.5 transition-colors duration-300 ${
                        isActive ? "text-brand-500 dark:text-brand-400" : "text-slate-400 dark:text-zinc-600"
                      }`}>
                        {f.icon}
                      </span>
                      <div>
                        <h3 className={`text-[14px] font-medium tracking-tight transition-colors duration-300 ${
                          isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400"
                        }`}>
                          {f.title}
                        </h3>
                        <motion.div
                          initial={false}
                          animate={{
                            height: isActive ? "auto" : 0,
                            opacity: isActive ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-[13px] font-light text-slate-500 dark:text-zinc-500 leading-relaxed mt-1.5 pr-2">
                            {f.description}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </FadeUp>

          {/* ── Live visual (right) ── */}
          <FadeUp delay={0.15} className="md:col-span-7">
            <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 overflow-hidden h-[360px] md:h-[400px] relative">
              <FeatureVisual activeId={FEATURES[active].id} />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ── Feature visual panel — switches content based on active feature ── */

function FeatureVisual({ activeId }: { activeId: string }) {
  return (
    <div className="relative h-full">
      {/* Analysis visual */}
      {activeId === "analysis" && (
        <motion.div
          key="analysis"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 p-6"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-600 mb-4">Tax Calculation — Sarah Mitchell</div>
          <div className="space-y-3">
            {[
              { label: "Gross income", val: "£195,500", sub: "Employment + dividends + rental" },
              { label: "Income Tax", val: "£42,432", sub: "Personal allowance tapered to £0" },
              { label: "National Insurance", val: "£5,486", sub: "Class 1 — primary threshold" },
              { label: "Dividend Tax", val: "£4,069", sub: "Higher rate on £32,000" },
              { label: "HICBC charge", val: "£860", sub: "Full clawback — income >£60k" },
            ].map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0"
              >
                <div>
                  <span className="text-[13px] font-light text-slate-700 dark:text-zinc-300">{row.label}</span>
                  <span className="block text-[10px] font-light text-slate-400 dark:text-zinc-600">{row.sub}</span>
                </div>
                <span className="text-[13px] font-mono font-light text-slate-900 dark:text-white">{row.val}</span>
              </motion.div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[13px] font-medium text-slate-900 dark:text-white">Total liability</span>
              <span className="text-[15px] font-mono font-medium text-slate-900 dark:text-white">£52,847</span>
            </div>
            <div className="text-[10px] font-light text-slate-400 dark:text-zinc-600 mt-1">Effective rate 27.0% &middot; Marginal rate 40%</div>
          </div>
        </motion.div>
      )}

      {/* Allowances visual */}
      {activeId === "allowances" && (
        <motion.div
          key="allowances"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 p-6"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-600 mb-5">Allowance Utilisation — 2025/26</div>
          <div className="space-y-5">
            {[
              { label: "Personal Allowance", used: 12570, total: 12570, note: "Tapered to £0" },
              { label: "Pension Annual Allowance", used: 18000, total: 60000, note: "£42k headroom" },
              { label: "ISA", used: 0, total: 20000, note: "Fully available" },
              { label: "Dividend", used: 500, total: 500, note: "Exhausted" },
              { label: "CGT Annual Exemption", used: 0, total: 3000, note: "Fully available" },
            ].map((a, i) => {
              const pct = Math.round((a.used / a.total) * 100);
              const barColor = pct >= 100 ? "bg-red-400" : pct >= 60 ? "bg-amber-400" : pct > 0 ? "bg-brand-400" : "bg-slate-200 dark:bg-zinc-700";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-light text-slate-700 dark:text-zinc-300">{a.label}</span>
                    <span className="text-[10px] font-light text-slate-400 dark:text-zinc-600">{a.note}</span>
                  </div>
                  <div className="h-[6px] bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 3)}%` }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Scenarios visual */}
      {activeId === "scenarios" && (
        <motion.div
          key="scenarios"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 p-6"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-600 mb-5">Scenario: £40k Pension Contribution</div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Before */}
            <div className="rounded-lg border border-slate-200/60 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-600 mb-3">Current</div>
              <div className="text-xl font-mono font-light text-slate-900 dark:text-white mb-1">£52,847</div>
              <div className="text-[10px] font-light text-slate-400 dark:text-zinc-600">Total tax liability</div>
              <div className="mt-3 text-[10px] font-light text-slate-500 dark:text-zinc-500">Effective rate 27.0%</div>
            </div>
            {/* After */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 p-4 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">After</div>
              <div className="text-xl font-mono font-light text-slate-900 dark:text-white mb-1">£36,047</div>
              <div className="text-[10px] font-light text-slate-400 dark:text-zinc-600">Total tax liability</div>
              <div className="mt-3 text-[10px] font-light text-emerald-600 dark:text-emerald-400">Effective rate 21.2%</div>
            </div>
          </div>
          {/* Saving */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-lg bg-brand-50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-800/30 p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-[12px] font-medium text-brand-700 dark:text-brand-300">Annual tax saving</div>
              <div className="text-[10px] font-light text-brand-600/70 dark:text-brand-400/70 mt-0.5">Pension contribution via salary sacrifice</div>
            </div>
            <div className="text-xl font-mono font-medium text-brand-600 dark:text-brand-400">£16,800</div>
          </motion.div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "PA restored", val: "£2,570" },
              { label: "HICBC removed", val: "£860" },
              { label: "NIC saved", val: "£520" },
            ].map((x, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="text-center"
              >
                <div className="text-[13px] font-mono font-light text-slate-900 dark:text-white">{x.val}</div>
                <div className="text-[10px] font-light text-slate-400 dark:text-zinc-600">{x.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Observations visual */}
      {activeId === "observations" && (
        <motion.div
          key="observations"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 p-6"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-600 mb-4">4 observations found</div>
          <div className="space-y-2.5">
            {[
              { sev: "critical" as const, title: "Personal allowance fully tapered", sub: "Income >£125,140 — consider pension to restore", border: "border-l-red-500", bg: "bg-red-50/60 dark:bg-red-950/20" },
              { sev: "opportunity" as const, title: "£42,000 pension headroom", sub: "Potential £16,800 saving at marginal rate", border: "border-l-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-950/20" },
              { sev: "opportunity" as const, title: "ISA allowance unused", sub: "Shelter dividend-generating assets to reduce tax", border: "border-l-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-950/20" },
              { sev: "warning" as const, title: "HICBC charge applies", sub: "Salary sacrifice could eliminate £860 charge", border: "border-l-amber-500", bg: "bg-amber-50/60 dark:bg-amber-950/20" },
            ].map((obs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-lg border-l-[3px] ${obs.border} ${obs.bg} px-4 py-3`}
              >
                <div className="text-[12px] font-normal text-slate-800 dark:text-zinc-200">{obs.title}</div>
                <div className="text-[10px] font-light text-slate-500 dark:text-zinc-500 mt-0.5">{obs.sub}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HOW IT WORKS — live animated workflow
   ═══════════════════════════════════════════════════ */

function HowItWorks() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  // Cycle through active step: 0 → 1 → 2 → 0 ...
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!isInView) {
      setActiveStep(-1);
      return;
    }
    // Start cycling once in view
    setActiveStep(0);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [isInView]);

  const steps = [
    {
      num: "01",
      icon: <IconUpload className="w-5 h-5" />,
      title: "Connect",
      description:
        "Import client data from your existing systems, or enter it directly.",
    },
    {
      num: "02",
      icon: <IconMessage className="w-5 h-5" />,
      title: "Ask",
      description:
        "Ask questions in natural language about your client's tax position.",
    },
    {
      num: "03",
      icon: <IconTarget className="w-5 h-5" />,
      title: "Act",
      description:
        "Get ranked observations and actionable recommendations.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-24 md:py-32 bg-slate-50/60 dark:bg-zinc-950/50 overflow-hidden"
    >
      <ParallaxLayer speed={0.1} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid" />
      </ParallaxLayer>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <FadeUp>
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-brand-500 mb-4">
              Workflow
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-extralight tracking-tight text-slate-900 dark:text-white">
              Three steps to{" "}
              <span className="font-normal">better outcomes</span>
            </h2>
          </FadeUp>
        </div>

        {/* Step cards with connecting animated pipeline */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 md:gap-0 relative">
            {/* ── Connecting lines + traveling pulse (desktop) ── */}
            {[0, 1].map((lineIdx) => (
              <div
                key={lineIdx}
                className="hidden md:block absolute top-[52px] h-px overflow-hidden"
                style={{
                  left: `${33.33 * (lineIdx + 1) - 6}%`,
                  width: "12%",
                }}
              >
                {/* Track line */}
                <div className="absolute inset-0 bg-slate-200 dark:bg-zinc-700" />
                {/* Traveling pulse */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-[3px] rounded-full bg-brand-500"
                  initial={{ left: "-20%", opacity: 0 }}
                  animate={
                    activeStep === lineIdx
                      ? {
                          left: ["0%", "100%"],
                          opacity: [0, 1, 1, 0],
                        }
                      : { left: "-20%", opacity: 0 }
                  }
                  transition={{
                    duration: 0.8,
                    ease: "easeInOut",
                  }}
                  style={{
                    boxShadow: "0 0 12px 2px rgba(92,124,250,0.5)",
                  }}
                />
              </div>
            ))}

            {steps.map((step, i) => {
              const isActive = activeStep === i;
              const isPast = activeStep > i;

              return (
                <FadeUp key={i} delay={i * 0.15} className="relative flex flex-col items-center text-center px-4">
                  {/* Step number */}
                  <div className="text-lg font-mono font-extralight text-brand-400/40 dark:text-brand-600/30 mb-3">
                    {step.num}
                  </div>

                  {/* Icon circle with active ring */}
                  <div className="relative mb-5">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.12 : 1,
                        borderColor: isActive
                          ? "var(--accent)"
                          : isPast
                            ? "var(--accent)"
                            : undefined,
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center transition-colors"
                    >
                      <span
                        className={`transition-colors duration-300 ${
                          isActive || isPast
                            ? "text-brand-500 dark:text-brand-400"
                            : "text-slate-400 dark:text-zinc-500"
                        }`}
                      >
                        {step.icon}
                      </span>
                    </motion.div>
                    {/* Active glow ring */}
                    {isActive && (
                      <motion.div
                        layoutId="step-glow"
                        className="absolute -inset-1.5 rounded-2xl border-2 border-brand-400/40 dark:border-brand-500/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          boxShadow: "0 0 20px -4px rgba(92,124,250,0.25)",
                        }}
                      />
                    )}
                  </div>

                  <h3 className="text-base font-medium text-slate-900 dark:text-white tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm font-light text-slate-500 dark:text-zinc-400 leading-relaxed mb-5 max-w-[240px]">
                    {step.description}
                  </p>

                  {/* ── Live micro-animation per step ── */}
                  <div className="w-full max-w-[220px] h-[100px] rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                    {i === 0 && <StepConnectAnim active={isActive} />}
                    {i === 1 && <StepAskAnim active={isActive} />}
                    {i === 2 && <StepActAnim active={isActive} />}
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Step 1: Connect — animated data rows importing ── */

function StepConnectAnim({ active }: { active: boolean }) {
  const rows = [
    { label: "Employment", val: "£145,000" },
    { label: "Dividends", val: "£32,500" },
    { label: "Rental", val: "£18,000" },
  ];

  return (
    <div className="p-3 space-y-2">
      {rows.map((row, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={
            active
              ? { opacity: 1, x: 0 }
              : { opacity: 0.3, x: 0 }
          }
          transition={{
            delay: active ? i * 0.2 : 0,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center justify-between"
        >
          <span className="text-[10px] font-light text-slate-500 dark:text-zinc-400">
            {row.label}
          </span>
          <span className="text-[10px] font-mono font-light text-slate-800 dark:text-zinc-200">
            {row.val}
          </span>
        </motion.div>
      ))}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={active ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="h-0.5 bg-emerald-400 rounded-full origin-left mt-1"
      />
    </div>
  );
}

/* ── Step 2: Ask — typing chat animation ── */

function StepAskAnim({ active }: { active: boolean }) {
  const fullText = "Tax saving opportunities?";
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setCharCount(0);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="p-3 flex flex-col justify-between h-full">
      {/* AI response placeholder */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-[70%] rounded-full bg-slate-100 dark:bg-zinc-800" />
        <div className="h-1.5 w-[55%] rounded-full bg-slate-100 dark:bg-zinc-800" />
      </div>

      {/* User typing */}
      <div className="flex items-end gap-1.5 mt-auto">
        <div className="flex-1 rounded-md bg-brand-500 px-2 py-1.5">
          <span className="text-[10px] font-light text-white">
            {fullText.slice(0, charCount)}
            {active && charCount < fullText.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-px h-2.5 bg-white/70 ml-px align-middle"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Act — results appearing with checks ── */

function StepActAnim({ active }: { active: boolean }) {
  const items = [
    { text: "Pension: save £16.8k", color: "text-emerald-500" },
    { text: "ISA: shelter dividends", color: "text-emerald-500" },
    { text: "HICBC: eliminate charge", color: "text-amber-500" },
  ];

  return (
    <div className="p-3 space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0.2, y: 0 }}
          transition={{
            delay: active ? i * 0.25 : 0,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center gap-1.5"
        >
          <motion.svg
            viewBox="0 0 16 16"
            className={`w-3 h-3 flex-shrink-0 ${item.color}`}
            initial={{ scale: 0 }}
            animate={active ? { scale: 1 } : { scale: 0 }}
            transition={{
              delay: active ? i * 0.25 + 0.15 : 0,
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <polyline
              points="5 8 7 10 11 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
          <span className="text-[10px] font-light text-slate-600 dark:text-zinc-300">
            {item.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STATS — animated counters
   ═══════════════════════════════════════════════════ */

function Stats() {
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-zinc-950 border-y border-slate-100 dark:border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <StaggerChildren stagger={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {[
            { value: "2025", suffix: "/26", label: "Tax year coverage" },
            { value: "22", suffix: "+", label: "Allowances tracked" },
            { prefix: "<", value: "2", suffix: "s", label: "Calculation speed" },
            { value: "100", suffix: "%", label: "UK-specific" },
          ].map((stat, i) => (
            <motion.div key={i} variants={staggerItem}>
              <div className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white font-mono tracking-tight">
                {stat.prefix ?? ""}
                <AnimatedCounter value={Number(stat.value)} />
                {stat.suffix ?? ""}
              </div>
              <div className="mt-1 text-xs font-light text-slate-400 dark:text-zinc-500 tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TESTIMONIAL
   ═══════════════════════════════════════════════════ */

function Testimonial() {
  return (
    <section className="py-24 md:py-32 bg-slate-50/60 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <FadeUp className="max-w-3xl mx-auto text-center">
          {/* Quote mark SVG */}
          <svg viewBox="0 0 24 24" className="w-8 h-8 mx-auto mb-6 text-brand-300 dark:text-brand-700" fill="currentColor">
            <path d="M11 7.05C8.17 8.2 6 11.5 6 14.78c0 2.06 1.27 3.22 2.8 3.22 1.42 0 2.7-1.1 2.7-2.6 0-1.42-1.02-2.5-2.3-2.5-.4 0-.72.1-1 .26.22-1.8 1.58-3.83 3.3-4.83L11 7.05zm7 0c-2.83 1.15-5 4.45-5 7.73 0 2.06 1.27 3.22 2.8 3.22 1.42 0 2.7-1.1 2.7-2.6 0-1.42-1.02-2.5-2.3-2.5-.4 0-.72.1-1 .26.22-1.8 1.58-3.83 3.3-4.83L18 7.05z" />
          </svg>

          <blockquote className="text-xl md:text-2xl font-extralight text-slate-800 dark:text-zinc-200 leading-relaxed">
            Helio has fundamentally changed how we approach tax planning reviews.
            What used to take hours now takes minutes, and the AI catches
            opportunities we might have missed.
          </blockquote>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs font-medium">
              JR
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white">James Richardson</p>
              <p className="text-xs font-light text-slate-400 dark:text-zinc-500">
                Director, Ashworth Financial Planning
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════ */

function CTA() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-slate-950 dark:bg-black text-white overflow-hidden">
      {/* Parallax grid */}
      <motion.div style={{ y: gridY }} className="absolute inset-0 bg-grid-dark pointer-events-none" />

      {/* Gradient accent orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center">
        <FadeUp className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6">
            <IconZap className="w-4 h-4 text-brand-400" />
            <span className="text-[12px] font-light tracking-wide text-slate-400">
              Ready to start
            </span>
          </div>

          <RevealMask>
            <h2 className="text-3xl md:text-4xl font-extralight tracking-tight leading-tight">
              Transform your{" "}
              <span className="font-normal">tax planning workflow</span>
            </h2>
          </RevealMask>

          <p className="mt-4 text-base font-light text-slate-400 leading-relaxed max-w-lg mx-auto">
            Join financial advisers who use Helio to deliver faster, more
            accurate tax planning for their clients.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <MagneticButton>
              <Link
                href="/chat"
                className="group inline-flex items-center gap-2 bg-white text-slate-900 text-sm font-normal px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Start free trial
                <IconArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </MagneticButton>
            <a
              href="#"
              className="text-sm font-light text-slate-400 hover:text-white transition-colors px-4 py-3"
            >
              Book a demo
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════ */

function Footer() {
  const cols = {
    Product: ["Features", "Pricing", "Changelog", "Documentation"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Legal: ["Privacy", "Terms", "Security"],
  };

  return (
    <footer className="bg-slate-950 dark:bg-black border-t border-slate-800/50 dark:border-zinc-800/30 text-slate-400 dark:text-zinc-500 py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <div className="text-white">
              <HelioLogo className="h-6" />
            </div>
            <p className="mt-4 text-sm font-light leading-relaxed max-w-xs">
              Tax intelligence for UK financial advisers. Analyse, plan, and
              deliver better client outcomes.
            </p>
          </div>

          {Object.entries(cols).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-600 mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm font-light hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t border-slate-800/50 dark:border-zinc-800/30 text-[11px] font-light text-slate-600 dark:text-zinc-700">
          &copy; {new Date().getFullYear()} Helio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonial />
      <CTA />
      <Footer />
    </main>
  );
}
