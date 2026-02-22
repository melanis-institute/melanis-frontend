import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bell,
  CalendarCheck2,
  LogOut,
  UsersRound,
  LayoutDashboard,
} from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { SecondaryButton } from "../../components/auth/AuthPrimitives";
import { useAuth } from "../../auth/useAuth";

function DashboardAction({
  icon: Icon,
  title,
  subtitle,
  onClick,
  delay,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  subtitle: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
      onClick={onClick}
      className="w-full rounded-[16px] border border-[rgba(17,18,20,0.1)] bg-white px-4 py-3.5 text-left transition hover:bg-[rgba(17,18,20,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[11px] bg-[rgba(0,65,94,0.08)]">
          <Icon className="h-[16px] w-[16px] text-[#00415E]" strokeWidth={1.9} />
        </div>
        <div>
          <p className="text-[14px] text-[#111214]" style={{ fontWeight: 600 }}>
            {title}
          </p>
          <p className="text-[12px] text-[rgba(17,18,20,0.55)]" style={{ fontWeight: 500 }}>
            {subtitle}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default function AU06() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <AuthLayout
      panelTagline={"Bienvenue\ndans votre espace"}
      panelSubtitle="Votre session est active. Reprenez rapidement vos actions principales."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          Tableau de bord
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          Bonjour {auth.user?.fullName ?? "Patient"}, choisissez votre prochaine action.
        </p>
      </motion.div>

      <div className="mt-6 space-y-3">
        <DashboardAction
          icon={CalendarCheck2}
          title="Réserver un RDV"
          subtitle="Démarrer un nouveau parcours patient"
          onClick={() => navigate("/patient-flow")}
          delay={0.04}
        />
        <DashboardAction
          icon={UsersRound}
          title="Gérer mes profils"
          subtitle="Moi, enfant ou proche"
          onClick={() => navigate("/patient-flow/auth/profil")}
          delay={0.08}
        />
        <DashboardAction
          icon={Bell}
          title="Préférences notifications"
          subtitle="SMS, WhatsApp, rappels RDV"
          onClick={() => setFeedback("Centre de préférences prêt pour l'intégration API.")}
          delay={0.12}
        />
      </div>

      {feedback ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 rounded-[12px] border border-[rgba(0,65,94,0.15)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[#00415E]"
          style={{ fontWeight: 500 }}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.16, ease: "easeOut" }}
        className="mt-6"
      >
        <SecondaryButton
          onClick={() => {
            void auth.logout();
            navigate("/patient-flow/auth", { replace: true });
          }}
        >
          <span className="inline-flex items-center gap-2">
            <LogOut className="h-[15px] w-[15px]" strokeWidth={1.9} />
            Se déconnecter
          </span>
        </SecondaryButton>
      </motion.div>
    </AuthLayout>
  );
}
