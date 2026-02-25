import { CreateDependentProfile } from "./CreateDependentProfile";

export default function PRF03CreateChild() {
  return (
    <CreateDependentProfile
      relationship="enfant"
      title="Créer profil enfant"
      subtitle="Création d'un sujet de soin mineur avec droits tuteur."
    />
  );
}
