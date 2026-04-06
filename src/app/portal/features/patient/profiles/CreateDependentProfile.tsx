import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import type { ProfileRelationship } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";

export function CreateDependentProfile({
  relationship,
  title,
  subtitle,
}: {
  relationship: Extract<ProfileRelationship, "enfant" | "proche">;
  title: string;
  subtitle: string;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!auth.user) {
      setError("Session utilisateur introuvable.");
      return;
    }

    try {
      setLoading(true);
      const result = await auth.accountAdapter.createOrLinkDependent({
        userId: auth.user.id,
        relationship,
        firstName,
        lastName,
        dateOfBirth,
      });
      await auth.refreshAccountData();
      await auth.setActingProfile(result.profile.id);
      navigate(`/patient-flow/profiles/${result.profile.id}`, { replace: true });
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de créer ce profil.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell title={title} subtitle={subtitle}>
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
            {loading ? "Création..." : "Créer le profil"}
          </button>

          {error ? (
            <p className="rounded-xl border border-[#5B1112]/30 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </AccountShell>
  );
}
