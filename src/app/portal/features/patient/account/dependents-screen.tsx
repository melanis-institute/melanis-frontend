import { useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, Link2Off, PlusCircle, UserCheck, UsersRound } from "lucide-react";
import { AccountShell } from "@portal/shared/layouts/AccountShell";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

type DependentRelationship = "enfant" | "proche";

export default function AU10Dependents() {
  const auth = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState<DependentRelationship>("enfant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const dependentProfiles = useMemo(
    () => auth.profiles.filter((profile) => profile.relationship !== "moi"),
    [auth.profiles],
  );

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setRelationship("enfant");
  };

  const handleCreateDependent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

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
      setStatus("Profil dépendant créé et activé.");
      resetForm();
    } catch (adapterError) {
      setError(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de créer le profil dépendant.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (profileId: string) => {
    if (!auth.user) return;
    setError(null);
    setStatus(null);

    try {
      setLoading(true);
      await auth.accountAdapter.unlinkDependent(auth.user.id, profileId);
      await auth.refreshAccountData();
      if (auth.actingProfileId === profileId) {
        auth.clearActingProfile();
      }
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
      title="Créer / lier un profil dépendant"
      subtitle="Ajoutez un enfant ou un proche, puis définissez le profil actif."
    >
      <section className="rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#5B1112]/8 p-2">
            <UsersRound size={14} className="text-[#5B1112]/70" />
          </div>
          <p className="text-sm text-[#111214]/62">
            Dès création, le profil dépendant peut devenir actif immédiatement pour les consentements,
            les notifications et les parcours médicaux.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.8rem] border border-white bg-white/84 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#111214]/75">Nouveau profil dépendant</h2>

          <form className="mt-3 space-y-3" onSubmit={handleCreateDependent}>
            <label className="block text-xs text-[#111214]/58">
              Relation
              <select
                value={relationship}
                onChange={(event) => setRelationship(event.target.value as DependentRelationship)}
                className="mt-1 w-full rounded-xl border border-[#111214]/15 bg-white px-3 py-2 text-sm text-[#111214]/74"
              >
                <option value="enfant">Enfant</option>
                <option value="proche">Proche</option>
              </select>
            </label>

            <label className="block text-xs text-[#111214]/58">
              Prénom
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                minLength={2}
                className="mt-1 w-full rounded-xl border border-[#111214]/15 bg-white px-3 py-2 text-sm text-[#111214]/74"
              />
            </label>

            <label className="block text-xs text-[#111214]/58">
              Nom
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                minLength={2}
                className="mt-1 w-full rounded-xl border border-[#111214]/15 bg-white px-3 py-2 text-sm text-[#111214]/74"
              />
            </label>

            <label className="block text-xs text-[#111214]/58">
              Date de naissance
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#111214]/15 bg-white px-3 py-2 text-sm text-[#111214]/74"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5B1112] px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
            >
              <PlusCircle size={14} />
              {loading ? "Enregistrement..." : "Créer le profil"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.8rem] border border-white bg-white/84 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#111214]/75">Dépendants liés</h2>

          <div className="mt-3 space-y-2.5">
            {dependentProfiles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#111214]/18 p-3 text-xs text-[#111214]/57">
                Aucun profil dépendant lié pour le moment.
              </p>
            ) : null}

            {dependentProfiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-[1.2rem] border border-[#111214]/10 bg-white px-3.5 py-3"
              >
                <p className="text-sm font-semibold text-[#111214]/76">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="mt-0.5 text-xs text-[#111214]/50">
                  {relationshipToLabel(profile.relationship)} · Né(e) le {new Date(
                    profile.dateOfBirth,
                  ).toLocaleDateString("fr-FR")}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void auth.setActingProfile(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#111214]/18 bg-white px-2.5 py-1 text-[11px] font-medium text-[#111214]/72"
                  >
                    <UserCheck size={11} />
                    Définir actif
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnlink(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#5B1112]/26 bg-[#5B1112]/6 px-2.5 py-1 text-[11px] font-medium text-[#5B1112]"
                  >
                    <Link2Off size={11} />
                    Révoquer le lien
                  </button>
                  {auth.actingProfileId === profile.id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      Profil actif
                      <ArrowUpRight size={11} />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {status ? (
        <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-[#5B1112]/30 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
          {error}
        </p>
      ) : null}
    </AccountShell>
  );
}
