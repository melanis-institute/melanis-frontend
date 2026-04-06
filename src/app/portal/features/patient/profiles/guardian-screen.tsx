import { Link, useParams } from "react-router";
import { useState } from "react";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

export default function PRF06Guardian() {
  const { profileId } = useParams();
  const auth = useAuth();
  const profile = auth.profiles.find((item) => item.id === profileId) ?? null;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRevokeLink = async () => {
    if (!auth.user || !profile) return;

    try {
      setLoading(true);
      setError(null);
      setStatus(null);
      await auth.accountAdapter.unlinkDependent(auth.user.id, profile.id);
      await auth.refreshAccountData();
      setStatus("Lien tuteur/accompagnant révoqué.");
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de révoquer le lien.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell
      title="Gestion tuteur / signataire"
      subtitle="Gouvernance d'accès pour profils mineurs ou dépendants."
    >
      {!profile ? (
        <p className="rounded-xl border border-[#5B1112]/25 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
          Profil introuvable.
        </p>
      ) : (
        <div className="max-w-xl space-y-3">
          <section className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#111214]">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="mt-1 text-xs text-[rgba(17,18,20,0.65)]">
              Relation profil: {relationshipToLabel(profile.relationship)}
            </p>
            <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.65)]">
              Signataire actuel: compte connecté
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void auth.setActingProfile(profile.id)}
                className="rounded-full border border-[rgba(17,18,20,0.2)] bg-white px-3 py-1.5 text-xs font-medium"
              >
                Définir profil actif
              </button>

              <button
                type="button"
                onClick={() => void handleRevokeLink()}
                disabled={loading}
                className="rounded-full border border-[#5B1112]/30 bg-[#5B1112]/5 px-3 py-1.5 text-xs font-medium text-[#5B1112] disabled:opacity-60"
              >
                Révoquer ce lien
              </button>

              <Link
                to="/patient-flow/account/consents"
                className="rounded-full border border-[rgba(17,18,20,0.2)] bg-white px-3 py-1.5 text-xs font-medium text-[#111214]"
              >
                Gérer consentements
              </Link>
            </div>
          </section>

          {status ? (
            <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-[#5B1112]/25 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </AccountShell>
  );
}
