import { Link } from "react-router";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

export default function PRF01ProfilesList() {
  const auth = useAuth();

  return (
    <AccountShell
      title="Liste des profils"
      subtitle="Moi / Enfant / Proche avec accès au détail, à l’édition et à la gestion tuteur."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          to="/patient-flow/profiles/create-child"
          className="rounded-full bg-[#5B1112] px-3 py-1.5 text-xs font-medium text-white"
        >
          Créer un profil enfant
        </Link>
        <Link
          to="/patient-flow/profiles/create-relative"
          className="rounded-full border border-[rgba(17,18,20,0.2)] bg-white px-3 py-1.5 text-xs font-medium text-[#111214]"
        >
          Créer un profil proche
        </Link>
      </div>

      <div className="space-y-2">
        {auth.profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-xl border border-[rgba(17,18,20,0.1)] bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111214]">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.62)]">
                  {relationshipToLabel(profile.relationship)} · Né(e) le {new Date(
                    profile.dateOfBirth,
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>

              {auth.actingProfileId === profile.id ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  Actif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void auth.setActingProfile(profile.id)}
                  className="rounded-full border border-[rgba(17,18,20,0.2)] px-2.5 py-1 text-[11px]"
                >
                  Activer
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Link
                to={`/patient-flow/profiles/${profile.id}`}
                className="rounded-full border border-[rgba(17,18,20,0.18)] bg-white px-2.5 py-1"
              >
                Voir le détail
              </Link>
              <Link
                to={`/patient-flow/profiles/${profile.id}/edit`}
                className="rounded-full border border-[rgba(17,18,20,0.18)] bg-white px-2.5 py-1"
              >
                Éditer
              </Link>
              <Link
                to={`/patient-flow/profiles/${profile.id}/guardian`}
                className="rounded-full border border-[rgba(17,18,20,0.18)] bg-white px-2.5 py-1"
              >
                Tuteur / signataire
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
