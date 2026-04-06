import { Headset, ImagePlus, ListChecks } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@portal/session/useAuth";

const MODULES = [
  {
    title: "Aide uploads/consentements",
    description: "Assistance guidée pour pièces manquantes et consentements.",
    icon: ImagePlus,
  },
  {
    title: "Planning & check-in",
    description: "Validation arrivée patient et préparation du flux clinique.",
    icon: ListChecks,
  },
  {
    title: "Support patient",
    description: "Traitement des demandes de support opérationnel.",
    icon: Headset,
  },
];

export default function StaffHome() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#111214]">Staff clinique</h1>
            <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
              Base opérationnelle prête. Modules complets dans le prochain sprint.
            </p>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
          >
            Se déconnecter
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {MODULES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-4">
              <item.icon className="text-[#5B1112]" size={20} />
              <p className="mt-3 text-sm font-semibold text-[#111214]">{item.title}</p>
              <p className="mt-1 text-xs text-[rgba(17,18,20,0.58)]">{item.description}</p>
              <p className="mt-3 inline-flex rounded-full bg-[rgba(0,65,94,0.09)] px-2 py-1 text-[11px] font-medium text-[#00415E]">
                Coming next
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
