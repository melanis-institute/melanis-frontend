import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { AccountShell } from "./AccountShell";
import { relationshipToLabel } from "../../account/mockAccountAdapter";
import { useAuth } from "../../auth/useAuth";

export default function AU05SelectProfile() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const returnTo = useMemo(() => {
    const fromState = (location.state as { returnTo?: string } | null)?.returnTo;
    if (fromState) return fromState;
    if (auth.flowContext?.returnTo) {
      return auth.flowContext.returnTo;
    }
    return "/patient-flow/auth/dashboard";
  }, [auth.flowContext, location.state]);

  const handleSelectProfile = async (profileId: string) => {
    setError(null);

    try {
      await auth.setActingProfile(profileId);
      setStatus("Profil actif mis à jour.");
      navigate(returnTo, { replace: true });
    } catch {
      setError("Impossible de sélectionner ce profil pour le moment.");
    }
  };

  return (
    <AccountShell
      title="Agir pour"
      subtitle="Choisissez le profil patient utilisé dans le parcours médical."
    >
      <section className="rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#5B1112]/8 p-2">
            <Sparkles size={14} className="text-[#5B1112]/70" />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Contexte patient
            </p>
            <p className="mt-1 text-sm text-[#111214]/65">
              Votre sélection s’applique aux consentements, notifications, dossier clinique et
              parcours RDV.
            </p>
          </div>
        </div>
      </section>

      {auth.isAccountLoading ? (
        <StateCard title="Chargement" message="Récupération des profils patients..." />
      ) : null}

      {!auth.isAccountLoading && auth.profiles.length === 0 ? (
        <StateCard
          title="Aucun profil"
          message="Ajoutez un profil dépendant ou rechargez la page."
        />
      ) : null}

      <div className="space-y-3">
        {auth.profiles.map((profile) => {
          const isActive = auth.actingProfileId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => void handleSelectProfile(profile.id)}
              className={[
                "w-full rounded-[1.6rem] border bg-white/85 p-4 text-left shadow-[0_3px_20px_rgba(0,0,0,0.04)] transition-all",
                isActive
                  ? "border-emerald-300 ring-2 ring-emerald-100"
                  : "border-[#111214]/8 hover:border-[#5B1112]/18 hover:bg-white",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-[#111214]/5 p-2">
                    <ProfileIcon relationship={profile.relationship} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[#111214]">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="mt-1 text-xs text-[rgba(17,18,20,0.6)]">
                      Relation: {relationshipToLabel(profile.relationship)}
                    </p>
                    <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.5)]">
                      Né(e) le {new Date(profile.dateOfBirth).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[rgba(17,18,20,0.06)] text-[rgba(17,18,20,0.65)]",
                    ].join(" ")}
                  >
                    {isActive ? "Actif" : "Sélectionner"}
                  </span>
                  {!isActive ? (
                    <ArrowUpRight size={13} className="text-[#111214]/30" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.6rem] border border-dashed border-[#111214]/20 bg-white/70 p-4">
        <p className="text-sm text-[rgba(17,18,20,0.72)]">
          Besoin d’un profil mineur ou proche ?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            to="/patient-flow/account/dependents"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#5B1112] px-3 py-1.5 text-xs font-medium text-white shadow-sm"
          >
            Gérer les dépendants
            <ArrowUpRight size={12} />
          </Link>
          <Link
            to="/patient-flow/profiles"
            className="rounded-full border border-[#111214]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#111214]/75"
          >
            Voir les profils
          </Link>
        </div>
      </div>

      {status ? <StateCard title="Succès" message={status} tone="success" /> : null}
      {error ? <StateCard title="Erreur" message={error} tone="error" /> : null}
    </AccountShell>
  );
}

function ProfileIcon({
  relationship,
}: {
  relationship: "moi" | "enfant" | "proche";
}) {
  let Icon: LucideIcon = UserRound;
  if (relationship === "enfant") Icon = Sparkles;
  if (relationship === "proche") Icon = HeartHandshake;

  return <Icon size={14} className="text-[#5B1112]/65" />;
}

function StateCard({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "error" | "success";
}) {
  const toneClass =
    tone === "error"
      ? "border-[#5B1112]/25 bg-[#5B1112]/5 text-[#5B1112]"
      : tone === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
        : "border-[#111214]/12 bg-white/85 text-[#111214]/72";

  return (
    <div className={`rounded-2xl border px-3.5 py-3 ${toneClass}`} role="status">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs">{message}</p>
    </div>
  );
}
