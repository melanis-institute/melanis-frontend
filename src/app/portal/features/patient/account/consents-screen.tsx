import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import { useAuth } from "@portal/session/useAuth";
import type { ConsentRecord, ConsentType } from "@portal/domains/account/types";

const TYPE_LABELS: Record<ConsentType, string> = {
  medical_record: "Dossier médical",
  media_share: "Partage médias",
  telederm: "Télé-dermatologie",
  ai_assist: "IA assistive",
  before_after: "Avant / Après",
  inter_practitioner: "Partage inter-praticiens",
  caregiver_access: "Accès tuteur / accompagnant",
};

const TYPE_GROUPS: Record<ConsentType, "Soin" | "Médias" | "Collaboration"> = {
  medical_record: "Soin",
  telederm: "Soin",
  ai_assist: "Soin",
  media_share: "Médias",
  before_after: "Médias",
  inter_practitioner: "Collaboration",
  caregiver_access: "Collaboration",
};

export default function AU08ConsentCenter() {
  const auth = useAuth();
  const location = useLocation();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const routeError = useMemo(
    () => (location.state as { error?: string } | null)?.error ?? null,
    [location.state],
  );

  const groupedConsents = useMemo(() => {
    return consents.reduce<Record<string, ConsentRecord[]>>((acc, consent) => {
      const group = TYPE_GROUPS[consent.type];
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(consent);
      return acc;
    }, {});
  }, [consents]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!auth.user || !auth.actingProfileId) {
        setConsents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextConsents = await auth.accountAdapter.listConsents(
          auth.user.id,
          auth.actingProfileId,
        );
        if (!cancelled) {
          setConsents(nextConsents);
        }
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les consentements.",
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
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  return (
    <AccountShell
      title="Gestion des consentements"
      subtitle="Version, statut, signature et révocation par profil patient."
    >
      <section className="rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#5B1112]/8 p-2">
            <ShieldCheck size={14} className="text-[#5B1112]/70" />
          </div>
          <p className="text-sm text-[#111214]/62">
            Vérifiez les consentements requis avant les actions médicales sensibles. Les versions
            sont immuables et chaque changement est horodaté.
          </p>
        </div>
      </section>

      {loading ? (
        <StatePill tone="neutral" message="Chargement des consentements..." />
      ) : null}

      {routeError ? <StatePill tone="error" message={routeError} /> : null}
      {error ? <StatePill tone="error" message={error} /> : null}

      {!loading && !error && consents.length === 0 ? (
        <StatePill
          tone="neutral"
          message="Aucun consentement disponible pour ce profil."
        />
      ) : null}

      <div className="space-y-4">
        {Object.entries(groupedConsents).map(([groupTitle, entries]) => (
          <section
            key={groupTitle}
            className="rounded-[1.75rem] border border-white bg-white/82 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111214]/38">
              {groupTitle}
            </h2>

            <div className="mt-3 space-y-2.5">
              {entries.map((consent) => (
                <Link
                  key={consent.id}
                  to={`/patient-flow/account/consents/${consent.id}`}
                  className="block rounded-[1.2rem] border border-[#111214]/9 bg-white px-3.5 py-3 transition-all hover:border-[#5B1112]/18 hover:bg-[#fffaf3]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111214]/78">
                        {TYPE_LABELS[consent.type]} · {consent.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#111214]/48">
                        Version {consent.version}
                        {consent.signedAt
                          ? ` · Signé le ${new Date(consent.signedAt).toLocaleString("fr-FR")}`
                          : " · Non signé"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={consent.status} />
                      <ArrowUpRight size={13} className="text-[#111214]/30" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AccountShell>
  );
}

function StatusBadge({ status }: { status: ConsentRecord["status"] }) {
  const config: Record<
    ConsentRecord["status"],
    { icon: LucideIcon; label: string; cls: string }
  > = {
    signed: {
      icon: CheckCircle2,
      label: "Signé",
      cls: "bg-emerald-100 text-emerald-700",
    },
    revoked: {
      icon: ShieldAlert,
      label: "Révoqué",
      cls: "bg-[#5B1112]/10 text-[#5B1112]",
    },
    pending: {
      icon: Clock3,
      label: "En attente",
      cls: "bg-[#111214]/8 text-[#111214]/66",
    },
  };

  const { icon: Icon, label, cls } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function StatePill({
  message,
  tone,
}: {
  message: string;
  tone: "neutral" | "error";
}) {
  const toneClass =
    tone === "error"
      ? "border-[#5B1112]/25 bg-[#5B1112]/5 text-[#5B1112]"
      : "border-[#111214]/12 bg-white/85 text-[#111214]/70";

  return <p className={`rounded-2xl border px-3 py-2 text-xs ${toneClass}`}>{message}</p>;
}
