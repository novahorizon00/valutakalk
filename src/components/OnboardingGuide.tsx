import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Globe, WifiOff, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

interface OnboardingGuideProps {
  lang: Lang;
  onComplete: () => void;
}

const steps = {
  nb: [
    { icon: Globe, title: "Velkommen til Valutakalkulator Pro", desc: "Takk for at du oppgraderte! Her er en rask oversikt over Pro-funksjonene dine." },
    { icon: WifiOff, title: "Offline-modus", desc: "Kursene lagres lokalt, slik at du kan konvertere uten internett – selv på flyet." },
    { icon: Star, title: "Valutakurser og historikk", desc: "Se alle kurser, sammenlign valutaer og følg trender med interaktive grafer." },
  ],
  en: [
    { icon: Globe, title: "Welcome to Currency Calculator Pro", desc: "Thanks for upgrading! Here's a quick overview of your Pro features." },
    { icon: WifiOff, title: "Offline mode", desc: "Rates are stored locally so you can convert without internet – even on the plane." },
    { icon: Star, title: "Rates & history", desc: "View all rates, compare currencies and track trends with interactive charts." },
  ],
};

export default function OnboardingGuide({ lang, onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const content = steps[lang];

  const next = () => {
    if (step < content.length - 1) setStep(step + 1);
    else onComplete();
  };

  const Icon = content[step].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center px-6"
    >
      <button onClick={onComplete} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground">
        <X className="h-5 w-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
            <Icon className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">{content[step].title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{content[step].desc}</p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex gap-2 mt-8 mb-6">
        {content.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>

      <Button onClick={next} className="rounded-xl px-8 gap-2 font-semibold">
        {step < content.length - 1
          ? (lang === "nb" ? "Neste" : "Next")
          : (lang === "nb" ? "Kom i gang" : "Get started")
        }
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
