import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthHeader } from "./AuthHeader";

interface AuthLayoutProps {
  children: ReactNode;
  /** Show back arrow on the form side */
  showBack?: boolean;
  /** Custom back handler — defaults to navigate(-1) */
  onBack?: () => void;
  /** Tagline rendered on the left gradient panel (desktop) */
  panelTagline?: string;
  /** Subtitle rendered below the tagline */
  panelSubtitle?: string;
  /** Show footer links — defaults to true */
  showFooter?: boolean;
}

export function AuthLayout({
  children,
  showBack = true,
  onBack,
  panelTagline = "Votre dermatologue,\nà portée de main.",
  panelSubtitle = "Consultations dermatologiques en ligne, adaptées au Sénégal.",
  showFooter = true,
}: AuthLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFAFA]">
      <AuthHeader />

      <div className="min-h-[100dvh] w-full flex flex-col md:flex-row pt-[102px] md:pt-[112px]">
        {/* ——— Left Panel (gradient / brand) — desktop only ——— */}
        <div className="relative hidden md:flex md:w-[45%] lg:w-[48%] overflow-hidden">
          {/* Base gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(162deg, #F5EEE4 0%, #E6DDD4 28%, #C5B8B0 50%, #5B1112 80%, #2A0B0D 100%)",
            }}
          />
          {/* Blur orbs */}
          <div
            className="absolute w-[140%] h-[140%] -top-[20%] -left-[20%]"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 30% 40%, rgba(247,243,237,0.34) 0%, transparent 74%)",
              filter: "blur(72px)",
            }}
          />
          <div
            className="absolute w-[100%] h-[100%] top-[10%] left-[30%]"
            style={{
              background:
                "radial-gradient(ellipse 45% 55% at 50% 50%, rgba(0,65,94,0.16) 0%, transparent 74%)",
              filter: "blur(78px)",
            }}
          />
          <div
            className="absolute w-[80%] h-[80%] bottom-[5%] left-[10%]"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 40% 60%, rgba(91,17,18,0.22) 0%, transparent 74%)",
              filter: "blur(62px)",
            }}
          />
          <div
            className="absolute w-[60%] h-[60%] top-[20%] left-[40%]"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(247,243,237,0.2) 0%, transparent 70%)",
              filter: "blur(56px)",
            }}
          />

          {/* Brand mark — top left */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute top-8 left-8 flex items-center gap-3 z-10"
          >
            <div
              className="w-[44px] h-[44px] rounded-[13px] flex items-center justify-center"
              style={{
                background: "rgba(250,250,250,0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(250,250,250,0.14)",
              }}
            >
              <span
                className="text-[20px] text-[#F7F3ED]"
                style={{ fontWeight: 800, letterSpacing: "-0.3px" }}
              >
                M
              </span>
            </div>
            <span
              className="text-[18px] text-[#F7F3ED]/90"
              style={{ fontWeight: 650, letterSpacing: "-0.3px" }}
            >
              Melanis
            </span>
          </motion.div>

          {/* Tagline — bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute bottom-10 left-8 right-8 z-10"
          >
            <h2
              className="text-[#F7F3ED] max-w-[320px] whitespace-pre-line"
              style={{
                fontSize: 28,
                fontWeight: 680,
                lineHeight: 1.25,
                letterSpacing: "-0.5px",
              }}
            >
              {panelTagline}
            </h2>
            <p
              className="text-[#F7F3ED]/62 mt-3 max-w-[280px]"
              style={{ fontSize: 14, fontWeight: 430, lineHeight: 1.55 }}
            >
              {panelSubtitle}
            </p>
          </motion.div>
        </div>

        {/* ——— Right Panel (form side) ——— */}
        <div className="flex-1 flex flex-col min-h-0">
          {showBack && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="shrink-0 px-6 pt-3 md:pt-5"
            >
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-[42px] h-[42px] rounded-full transition-colors hover:bg-[rgba(17,18,20,0.04)] active:bg-[rgba(17,18,20,0.06)] cursor-pointer"
              >
                <ArrowLeft
                  className="w-[20px] h-[20px] text-[#111214]/60"
                  strokeWidth={1.7}
                />
              </button>
            </motion.div>
          )}

          <div className="flex-1 flex items-start md:items-center justify-center overflow-y-auto">
            <div className="w-full max-w-[420px] px-6 py-6 md:py-10">
              {children}

              {/* Footer */}
              {showFooter && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-10 pt-6 flex items-center justify-center gap-1.5"
                  style={{
                    borderTop: "1px solid rgba(17,18,20,0.05)",
                  }}
                >
                  <ShieldCheck
                    className="w-[13px] h-[13px] text-[#00415E]/40"
                    strokeWidth={1.7}
                  />
                  <span
                    className="text-[11px] text-[#111214]/25"
                    style={{ fontWeight: 450 }}
                  >
                    Données sécurisées
                  </span>
                  <span className="text-[11px] text-[#111214]/15 mx-1.5">
                    ·
                  </span>
                  <span
                    className="text-[11px] text-[#00415E]/30 hover:text-[#00415E]/50 cursor-pointer transition-colors"
                    style={{ fontWeight: 430 }}
                  >
                    Confidentialité
                  </span>
                  <span className="text-[11px] text-[#111214]/15 mx-1.5">
                    ·
                  </span>
                  <span
                    className="text-[11px] text-[#00415E]/30 hover:text-[#00415E]/50 cursor-pointer transition-colors"
                    style={{ fontWeight: 430 }}
                  >
                    Conditions
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
