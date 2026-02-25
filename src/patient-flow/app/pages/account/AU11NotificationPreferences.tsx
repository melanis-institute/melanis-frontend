import { useEffect, useState } from "react";
import { BellRing, MessageCircle, Smartphone } from "lucide-react";
import { AccountShell } from "./AccountShell";
import type {
  NotificationChannelPreference,
  NotificationPreference,
} from "../../account/types";
import { useAuth } from "../../auth/useAuth";

type PrefKey = Exclude<keyof NotificationPreference, "id" | "profileId" | "updatedAt">;

const PREF_SECTIONS: Array<{ key: PrefKey; label: string; description: string }> = [
  {
    key: "reminders",
    label: "Rappels RDV / check-ins",
    description: "Confirmations, relances et suivi programmé.",
  },
  {
    key: "prevention",
    label: "Prévention (UV / météo / poussière)",
    description: "Alertes contextuelles liées à votre environnement.",
  },
  {
    key: "screening",
    label: "Rappels de dépistage",
    description: "Cadences de suivi et rappels préventifs.",
  },
  {
    key: "telederm",
    label: "Télé-derm et compléments",
    description: "Notifications de cas et demandes d’informations.",
  },
  {
    key: "billing",
    label: "Facturation / devis",
    description: "Paiements, reçus, devis et mises à jour administratives.",
  },
];

const CHANNELS: Array<{ key: keyof NotificationChannelPreference; label: string }> = [
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
];

export default function AU11NotificationPreferences() {
  const auth = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!auth.user || !auth.actingProfileId) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const next = await auth.accountAdapter.getNotificationPreferences(
          auth.user.id,
          auth.actingProfileId,
        );
        if (!cancelled) {
          setPreferences(next);
        }
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les préférences.",
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

  const toggleChannel = async (
    sectionKey: PrefKey,
    channelKey: keyof NotificationChannelPreference,
  ) => {
    if (!auth.user || !auth.actingProfileId || !preferences) return;

    const section = preferences[sectionKey] as NotificationChannelPreference;
    const nextPatch = {
      [sectionKey]: {
        ...section,
        [channelKey]: !section[channelKey],
      },
    } as Partial<Omit<NotificationPreference, "id" | "profileId" | "updatedAt">>;

    try {
      setLoading(true);
      const updated = await auth.accountAdapter.updateNotificationPreferences({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        patch: nextPatch,
      });
      setPreferences(updated);
      setStatus("Préférences mises à jour.");
      setError(null);
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de mettre à jour les préférences.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell
      title="Préférences notifications"
      subtitle="Canaux SMS / WhatsApp / Email paramétrés par profil patient."
    >
      <section className="rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#5B1112]/8 p-2">
            <BellRing size={14} className="text-[#5B1112]/70" />
          </div>
          <p className="text-sm text-[#111214]/62">
            Chaque préférence est liée au profil actif. Les réglages de dépistage restent synchronisés
            avec les paramètres de rappels du dashboard.
          </p>
        </div>
      </section>

      {loading ? <Banner tone="neutral" text="Chargement des préférences..." /> : null}
      {error ? <Banner tone="error" text={error} /> : null}
      {status ? <Banner tone="success" text={status} /> : null}

      {!loading && preferences ? (
        <div className="space-y-3">
          {PREF_SECTIONS.map((section) => {
            const sectionValue = preferences[section.key] as NotificationChannelPreference;
            return (
              <section
                key={section.key}
                className="rounded-[1.75rem] border border-white bg-white/84 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
              >
                <h2 className="text-sm font-semibold text-[#111214]/75">{section.label}</h2>
                <p className="mt-1 text-xs text-[#111214]/52">{section.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHANNELS.map((channel) => {
                    const enabled = sectionValue[channel.key];
                    return (
                      <button
                        key={`${section.key}-${channel.key}`}
                        type="button"
                        onClick={() => void toggleChannel(section.key, channel.key)}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          enabled
                            ? "bg-[#5B1112] text-white shadow-sm shadow-[#5B1112]/25"
                            : "border border-[#111214]/20 bg-white text-[#111214]/70",
                        ].join(" ")}
                      >
                        {channel.key === "sms" ? (
                          <Smartphone size={12} />
                        ) : channel.key === "whatsapp" ? (
                          <MessageCircle size={12} />
                        ) : (
                          <BellRing size={12} />
                        )}
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </AccountShell>
  );
}

function Banner({
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
