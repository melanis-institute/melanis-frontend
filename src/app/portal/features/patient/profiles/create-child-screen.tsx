import { CreateDependentProfile } from "./CreateDependentProfile";

export default function CreateChildScreen() {
  return (
    <CreateDependentProfile
      relationship="enfant"
      title="Créer profil enfant"
      subtitle="Création d'un sujet de soin mineur avec droits tuteur."
    />
  );
}
