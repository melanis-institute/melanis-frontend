import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { AccountShell } from "../account/AccountShell";
import { useAuth } from "../../auth/useAuth";

export default function PRF05EditProfile() {
  const { profileId } = useParams();
  const auth = useAuth();
  const profile = useMemo(
    () => auth.profiles.find((item) => item.id === profileId) ?? null,
    [auth.profiles, profileId],
  );

  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!profile || !auth.user) {
      setError("Profil introuvable.");
      return;
    }

    try {
      setLoading(true);
      await auth.accountAdapter.updateProfile({
        actorUserId: auth.user.id,
        profileId: profile.id,
        firstName,
        lastName,
        dateOfBirth,
      });
      await auth.refreshAccountData();
      setStatus("Profil mis à jour.");
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de modifier ce profil.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell title="Éditer profil" subtitle="Mise à jour des données du sujet de soin.">
      {!profile ? (
        <p className="rounded-xl border border-[#5B1112]/25 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
          Profil introuvable.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl rounded-2xl border border-[rgba(17,18,20,0.1)] bg-white p-4 shadow-sm"
        >
          <div className="space-y-3">
            <label className="block text-xs text-[rgba(17,18,20,0.7)]">
              Prénom
              <input
                required
                minLength={2}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[rgba(17,18,20,0.15)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs text-[rgba(17,18,20,0.7)]">
              Nom
              <input
                required
                minLength={2}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[rgba(17,18,20,0.15)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs text-[rgba(17,18,20,0.7)]">
              Date de naissance
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[rgba(17,18,20,0.15)] px-3 py-2 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#5B1112] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Mise à jour..." : "Enregistrer"}
            </button>

            {status ? (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {status}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-[#5B1112]/30 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
                {error}
              </p>
            ) : null}

            <Link
              to={`/patient-flow/profiles/${profile.id}`}
              className="inline-block text-xs text-[#00415E] underline"
            >
              Retour au détail du profil
            </Link>
          </div>
        </form>
      )}
    </AccountShell>
  );
}
