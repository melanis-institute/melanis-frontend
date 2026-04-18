import { Link, useParams } from "react-router";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

export default function ProfileDetailScreen() {
  const { profileId } = useParams();
  const auth = useAuth();
  const profile = auth.profiles.find((item) => item.id === profileId) ?? null;

  return (
    <AccountShell
      title="Profil détail"
      subtitle="Informations cliniques de base du sujet de soin."
    >
      {!profile ? (
        <p className="rounded-xl border border-[#5B1112]/25 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
          Profil introuvable.
        </p>
      ) : (
        <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-[#111214]">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="mt-1 text-sm text-[rgba(17,18,20,0.65)]">
            Relation: {relationshipToLabel(profile.relationship)}
          </p>
          <p className="mt-0.5 text-sm text-[rgba(17,18,20,0.65)]">
            Date de naissance: {new Date(profile.dateOfBirth).toLocaleDateString("fr-FR")}
          </p>
          <p className="mt-0.5 text-sm text-[rgba(17,18,20,0.65)]">Identifiant: {profile.id}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link
              to={`/patient-flow/profiles/${profile.id}/edit`}
              className="rounded-full bg-[#5B1112] px-3 py-1.5 font-medium text-white"
            >
              Éditer
            </Link>
            <Link
              to={`/patient-flow/profiles/${profile.id}/guardian`}
              className="rounded-full border border-[rgba(17,18,20,0.2)] bg-white px-3 py-1.5 font-medium text-[#111214]"
            >
              Tuteur / signataire
            </Link>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
