import { motion } from "motion/react";
import heroImg from "../assets/bc9f0e4f835953dd90723b4b488a1ce605a0a01e.png";

interface StepIntroProps {
  onStart: () => void;
  onSkip: () => void;
}

export function StepIntro({ onStart, onSkip }: StepIntroProps) {
  return (
    <div
      className="flex flex-col h-full min-h-0 rounded-b-[32px] md:rounded-[32px] overflow-hidden"
      style={{
        background:
          "linear-gradient(165deg, #FAFAFA 0%, #F7F2EA 45%, rgba(91,17,18,0.04) 82%, rgba(0,65,94,0.03) 100%)",
      }}
    >
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center">
        {/* Hero image area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full flex items-center justify-center px-4"
        >
          {/* Soft radial glow behind image */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(247,243,237,0.32) 0%, transparent 74%)",
            }}
          />
          <img
            src={heroImg}
            alt="Analyse dermatologique"
            className="relative w-full max-w-[320px] md:max-w-[360px] h-auto object-contain"
            style={{
              filter: "drop-shadow(0 8px 24px rgba(17,18,20,0.06))",
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* Title + subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-center px-6 md:px-10 mt-5 md:mt-6 pb-4"
        >
          <h1
            className="text-[26px] md:text-[30px] text-[#111214] tracking-[-0.5px] leading-[1.2]"
            style={{ fontWeight: 700 }}
          >
            Préparons votre consultation dermatologique
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-3.5 text-[15px] text-[rgba(17,18,20,0.45)] leading-[1.55] max-w-[320px] mx-auto"
          >
            Quelques questions pour aider votre dermatologue à mieux comprendre votre peau.{" "}
            <span className="text-[rgba(17,18,20,0.3)]">(~3 min)</span>
          </motion.p>
        </motion.div>
      </div>

      {/* CTAs pinned at bottom */}
      <div
        className="shrink-0 px-5 md:px-8 pt-4"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        }}
      >
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          onClick={onStart}
          className="w-full h-[52px] rounded-[16px] text-white text-[16px] tracking-[-0.2px] cursor-pointer active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)",
            boxShadow:
              "0 2px 8px rgba(91,17,18,0.16), 0 1px 3px rgba(17,18,20,0.06)",
            fontWeight: 600,
          }}
        >
          Commencer
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          onClick={onSkip}
          className="w-full mt-3 py-3 text-[14px] text-[rgba(17,18,20,0.52)] hover:text-[rgba(17,18,20,0.7)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
          style={{ fontWeight: 520 }}
        >
          Passer la pré-consultation
        </motion.button>
      </div>
    </div>
  );
}
