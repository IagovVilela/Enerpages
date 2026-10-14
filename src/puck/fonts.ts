import { Bebas_Neue, Cormorant_Garamond, Figtree, Fraunces, Instrument_Serif, Literata, Manrope, Newsreader, Outfit, Syne } from "next/font/google";
import { BODY_FONTS, DISPLAY_FONTS } from "@/puck/schema";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap" });

const displayVars: Record<(typeof DISPLAY_FONTS)[number], { className: string; variable: string }> = {
  Fraunces: { className: fraunces.variable, variable: "--font-fraunces" },
  Newsreader: { className: newsreader.variable, variable: "--font-newsreader" },
  "Instrument Serif": { className: instrument.variable, variable: "--font-instrument" },
  "Bebas Neue": { className: bebas.variable, variable: "--font-bebas" },
  Syne: { className: syne.variable, variable: "--font-syne" },
  "Cormorant Garamond": { className: cormorant.variable, variable: "--font-cormorant" },
};

const bodyVars: Record<(typeof BODY_FONTS)[number], { className: string; variable: string }> = {
  Outfit: { className: outfit.variable, variable: "--font-outfit" },
  Figtree: { className: figtree.variable, variable: "--font-figtree" },
  Manrope: { className: manrope.variable, variable: "--font-manrope" },
  Literata: { className: literata.variable, variable: "--font-literata" },
};

export function fontAssets(display: string, body: string) {
  const displayFont = displayVars[display as keyof typeof displayVars] ?? displayVars.Fraunces;
  const bodyFont = bodyVars[body as keyof typeof bodyVars] ?? bodyVars.Outfit;
  return {
    className: `${displayFont.className} ${bodyFont.className}`,
    displayVar: displayFont.variable,
    bodyVar: bodyFont.variable,
  };
}
