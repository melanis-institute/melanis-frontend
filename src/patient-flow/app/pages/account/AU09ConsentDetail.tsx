import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AccountShell } from "./AccountShell";
import type { ConsentRecord, ConsentType } from "../../account/types";
import { useAuth } from "../../auth/useAuth";

const CONSENT_COPY: Record<string, string> = {
  medical_record:
    "J'autorise l'accès au dossier médical du profil patient sélectionné pour le suivi clinique Melanis.",
  media_share:
    "J'autorise la collecte et le partage des images cliniques selon le périmètre médical défini.",
  telederm:
    "J'autorise l'utilisation des données dans le cadre de la télé-dermatologie asynchrone.",
  ai_assist:
    "J'autorise l'utilisation d'une IA assistive non décisionnelle pour améliorer l'orientation clinique.",
  before_after:
    "J'autorise l'utilisation encadrée des contenus avant/après selon les règles applicables.",
  inter_practitioner:
    "J'autorise le partage sécurisé d'éléments vers des praticiens collaborateurs.",
  caregiver_access:
    "J'autorise l'accès tuteur/accompagnant pour les actions médicales du profil dépendant.",
};

const TYPE_LABELS: Record<ConsentType, string> = {
  medical_record: "Dossier médical",
  media_share: "Partage médias",
  telederm: "Télé-dermatologie",
  ai_assist: "IA assistive",
  before_after: "Avant / Après",
  inter_practitioner: "Partage inter-praticiens",
  caregiver_access: "Accès tuteur / accompagnant",
};

export default function AU09ConsentDetail() {
  const { consentId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const returnTo = useMemo(
    () => (location.state as { returnTo?: string } | null)?.returnTo,
    [location.state],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!auth.user) {
        setError("Session utilisateur introuvable.");
        setLoading(false);
        return;
      }

      if (!auth.actingProfileId) {
        navigate("/patient-flow/account/select-profile", { replace: true });
        return;
      }

      if (!consentId) {
        setError("Consentement introuvable.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextConsent = await auth.accountAdapter.getConsent(auth.user.id, consentId);
        if (!cancelled) {
          setConsent(nextConsent);
          if (!nextConsent) {
            navigate("/patient-flow/account/consents", {
              replace: true,
              state: { error: "Consentement introuvable pour ce profil." },
            });
          } else if (nextConsent.profileId !== auth.actingProfileId) {
            navigate("/patient-flow/account/consents", {
              replace: true,
              state: { error: "Consentement non accessible pour le profil actif." },
            });
          }
        }
      } catch (adapterError) {
        if (!cancelled) {
          if (
            adapterError instanceof Error &&
            adapterError.message.toLowerCase().includes("accès refusé")
          ) {
            navigate("/patient-flow/account/consents", {
              replace: true,
              state: { error: "Consentement non accessible pour le profil actif." },
            });
          }
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger le consentement.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [auth.accountAdapter, auth.actingProfileId, auth.user, consentId, navigate]);

  const handleSign = async () => {
    if (!consent || !auth.user) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await auth.accountAdapter.signConsent({
        consentId: consent.id,
        actorUserId: auth.user.id,
      });
      setConsent(updated);
      setStatus("Consentement signé.");
      await auth.refreshAccountData();
      await auth.refreshConsentSnapshot(consent.profileId);

      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de signer ce consentement.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!consent || !auth.user) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await auth.accountAdapter.revokeConsent({
        consentId: consent.id,
        actorUserId: auth.user.id,
      });
      setConsent(updated);
      setStatus("Consentement révoqué.");
      await auth.refreshAccountData();
      await auth.refreshConsentSnapshot(consent.profileId);
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de révoquer ce consentement.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell
      title="Consentement détail / signature"
      subtitle="Version immutable, signature horodatée et révocation traçable."
    >
      {loading ? <Message tone="neutral" text="Chargement..." /> : null}
      {error ? <Message tone="error" text={error} /> : null}
      {status ? <Message tone="success" text={status} /> : null}

      {consent ? (
        <section className="space-y-4 rounded-[1.9rem] border border-white bg-white/85 p-5 shadow-[0_4px_26px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/34">
                {TYPE_LABELS[consent.type]}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#111214]">{consent.title}</h2>
              <p className="mt-1 text-xs text-[#111214]/52">
                Version {consent.version} · Dernière mise à jour{" "}
                {new Date(consent.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <StatusBadge status={consent.status} />
          </div>

          <div className="rounded-[1.2rem] border border-[#111214]/9 bg-[#fffaf1] px-4 py-3 text-sm leading-relaxed text-[#111214]/75">
            {CONSENT_COPY[consent.type] ?? "Texte de consentement indisponible."}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSign()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5B1112] px-3.5 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-60"
            >
              <ShieldCheck size={12} />
              Signer ce consentement
            </button>

            <button
              type="button"
              onClick={() => void handleRevoke()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#5B1112]/25 bg-[#5B1112]/6 px-3.5 py-2 text-xs font-medium text-[#5B1112] disabled:opacity-60"
            >
              <ShieldAlert size={12} />
              Révoquer
            </button>

            <Link
              to="/patient-flow/account/consents"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#111214]/18 bg-white px-3.5 py-2 text-xs font-medium text-[#111214]/72"
            >
              <ArrowLeft size={12} />
              Retour à la liste
            </Link>
          </div>
        </section>
      ) : null}
    </AccountShell>
  );
}

function StatusBadge({ status }: { status: ConsentRecord["status"] }) {
  if (status === "signed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 size={11} />
        Signé
      </span>
    );
  }
  if (status === "revoked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#5B1112]/10 px-2.5 py-1 text-[11px] font-medium text-[#5B1112]">
        <ShieldAlert size={11} />
        Révoqué
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#111214]/8 px-2.5 py-1 text-[11px] font-medium text-[#111214]/66">
      <ShieldCheck size={11} />
      En attente
    </span>
  );
}

function Message({
  text,
  tone,
}: {
  text: string;
  tone: "neutral" | "error" | "success";
}) {
  const cls =
    tone === "error"
      ? "border-[#5B1112]/25 bg-[#5B1112]/5 text-[#5B1112]"
      : tone === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
        : "border-[#111214]/12 bg-white/85 text-[#111214]/72";

  return <p className={`rounded-2xl border px-3 py-2 text-xs ${cls}`}>{text}</p>;
}
