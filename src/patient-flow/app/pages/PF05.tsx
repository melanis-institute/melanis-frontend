import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Home,
  MapPin,
  Pencil,
  Share2,
  Video,
} from "lucide-react";
import { HeaderBack } from "../components/HeaderBack";
import { PageLayout } from "../components/PageLayout";
import { StepIndicator } from "../components/StepIndicator";
import { PersistentContextBar } from "../components/PersistentContextBar";
import { relationshipToLabel } from "../account/mockAccountAdapter";
import { useAuth } from "../auth/useAuth";
import { practitionerIdFromName } from "../appointments/mockAppointmentAdapter";

type ReminderPrefs = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
};

function formatDateLabel(date?: string) {
  if (!date) return "À définir";
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function toIcsDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}Z`;
}

function downloadBlob(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function ActionCard({
  icon: Icon,
  title,
  subtitle,
  onClick,
  index,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: 0.12 + index * 0.05, ease: "easeOut" }}
      onClick={onClick}
      className="w-full rounded-[16px] bg-white px-4 py-3.5 text-left transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
      style={{
        boxShadow:
          "0 1px 3px rgba(17,18,20,0.03), 0 2px 8px rgba(17,18,20,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-[36px] w-[36px] rounded-[11px] flex items-center justify-center"
          style={{ background: "rgba(0,65,94,0.08)" }}
        >
          <Icon className="h-[16px] w-[16px] text-[#00415E]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-[#111214]" style={{ fontWeight: 560 }}>
            {title}
          </p>
          <p className="mt-0.5 text-[12px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 460 }}>
            {subtitle}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function ChecklistItem({
  checked,
  text,
  onToggle,
}: {
  checked: boolean;
  text: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-[rgba(17,18,20,0.03)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="h-[18px] w-[18px] rounded-[6px] border flex items-center justify-center"
          style={{
            borderColor: checked ? "rgba(0,65,94,0.3)" : "rgba(17,18,20,0.2)",
            background: checked ? "rgba(0,65,94,0.1)" : "transparent",
          }}
        >
          {checked ? (
            <CheckCircle2 className="h-[12px] w-[12px] text-[#00415E]" strokeWidth={2.2} />
          ) : null}
        </div>
        <p
          className="text-[13px] text-[#111214]"
          style={{ fontWeight: checked ? 540 : 480, opacity: checked ? 0.8 : 0.66 }}
        >
          {text}
        </p>
      </div>
    </button>
  );
}

export default function PF05() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const auth = useAuth();

  const appointmentType = state?.appointmentType ?? "presentiel";
  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));
  const selectedSlot = state?.selectedSlot ?? {
    date: "Lundi 24 février 2026",
    time: "10:30",
  };
  const practitioner = state?.practitioner ?? {
    name: "Dr. Aissatou Diallo",
    specialty: "Dermatologie",
    location: "Cabinet Mermoz, Dakar",
    fee: "15 000 FCFA",
  };

  const [showContent, setShowContent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm24h, setConfirm24h] = useState(true);
  const [intakeNudge, setIntakeNudge] = useState(true);
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>({
    sms: true,
    whatsapp: true,
    email: false,
  });
  const [prepChecklist, setPrepChecklist] = useState({
    documents: false,
    paiement: false,
    questions: false,
  });
  const timelineLoggedRef = useRef(false);
  const appointmentLoggedRef = useRef(false);

  const hasPreConsult = Boolean(state?.preConsultData);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 280);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [feedback]);

  const checklistProgress = useMemo(() => {
    const items = Object.values(prepChecklist);
    const done = items.filter(Boolean).length;
    return `${done}/${items.length}`;
  }, [prepChecklist]);

  const resolvedAppointmentDate = useMemo(() => {
    const isoDate = state?.date as string | undefined;
    const isoTime = (state?.time as string | undefined) ?? selectedSlot.time;
    if (isoDate && isoTime) {
      const [year, month, day] = isoDate.split("-").map(Number);
      const [hour, minute] = isoTime.split(":").map(Number);
      return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    }

    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + 1);
    return fallback;
  }, [state?.date, state?.time, selectedSlot.time]);

  const timelineSourceRef = useMemo(() => {
    if (!auth.actingProfileId) return null;
    const practitionerRef = String(practitioner.name ?? "praticien")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    const dateRef = String(state?.date ?? selectedSlot.date ?? "date").trim();
    const timeRef = String(state?.time ?? selectedSlot.time ?? "time").trim();
    return `booking:${auth.actingProfileId}:${dateRef}:${timeRef}:${practitionerRef}:${appointmentType}`;
  }, [
    appointmentType,
    auth.actingProfileId,
    practitioner.name,
    selectedSlot.date,
    selectedSlot.time,
    state?.date,
    state?.time,
  ]);

  useEffect(() => {
    if (timelineLoggedRef.current) return;
    if (!auth.user || !auth.actingProfileId || !timelineSourceRef) return;

    timelineLoggedRef.current = true;

    void auth.accountAdapter.appendTimelineEvent({
      actorUserId: auth.user.id,
      profileId: auth.actingProfileId,
      type: "appointment_booked",
      title: "Rendez-vous confirmé",
      description: `${selectedSlot.date} à ${selectedSlot.time} avec ${practitioner.name}`,
      source: "booking_flow",
      sourceRef: timelineSourceRef,
      meta: {
        appointmentType,
        practitionerName: practitioner.name,
        date: selectedSlot.date,
        time: selectedSlot.time,
      },
    });
  }, [
    appointmentType,
    auth.accountAdapter,
    auth.actingProfileId,
    auth.user,
    practitioner.name,
    selectedSlot.date,
    selectedSlot.time,
    timelineSourceRef,
  ]);

  useEffect(() => {
    if (appointmentLoggedRef.current) return;
    if (!auth.user || !auth.actingProfileId || !timelineSourceRef) return;

    appointmentLoggedRef.current = true;

    const patientLabel = auth.actingProfile
      ? `${auth.actingProfile.firstName} ${auth.actingProfile.lastName}`.trim()
      : "Profil patient";

    void auth.appointmentAdapter.createAppointmentFromBooking({
      bookingSourceRef: timelineSourceRef,
      profileId: auth.actingProfileId,
      patientLabel,
      practitionerId: practitionerIdFromName(String(practitioner.name ?? "")),
      practitionerName: String(practitioner.name ?? "Praticien"),
      practitionerSpecialty:
        typeof practitioner.specialty === "string" ? practitioner.specialty : undefined,
      practitionerLocation:
        typeof practitioner.location === "string" ? practitioner.location : undefined,
      appointmentType,
      scheduledFor: resolvedAppointmentDate.toISOString(),
      dateLabel: String(selectedSlot.date ?? "À définir"),
      timeLabel: String(selectedSlot.time ?? "À définir"),
      createdByUserId: auth.user.id,
      preConsultData: state?.preConsultData,
    });
  }, [
    appointmentType,
    auth.actingProfile,
    auth.actingProfileId,
    auth.appointmentAdapter,
    auth.user,
    practitioner.location,
    practitioner.name,
    practitioner.specialty,
    resolvedAppointmentDate,
    selectedSlot.date,
    selectedSlot.time,
    state?.preConsultData,
    timelineSourceRef,
  ]);

  const setReminder = (key: keyof ReminderPrefs) => {
    setReminderPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChecklist = (key: keyof typeof prepChecklist) => {
    setPrepChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddCalendar = () => {
    const start = resolvedAppointmentDate;
    const end = new Date(start.getTime() + 20 * 60 * 1000);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Melanis//PatientFlow//FR",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@melanis.app`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:Consultation dermatologique - ${practitioner.name}`,
      `LOCATION:${
        appointmentType === "video" ? "Consultation vidéo" : practitioner.location
      }`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    downloadBlob("rendez-vous-melanis.ics", "text/calendar;charset=utf-8", ics);
    setFeedback("Événement calendrier téléchargé");
  };

  const handleDownloadRecap = () => {
    const recap = [
      "Récapitulatif de rendez-vous - Melanis",
      "",
      `Praticien: ${practitioner.name}`,
      `Spécialité: ${practitioner.specialty}`,
      `Type: ${appointmentType === "video" ? "Vidéo" : "Présentiel"}`,
      `Date: ${selectedSlot.date}`,
      `Heure: ${selectedSlot.time}`,
      `Lieu: ${
        appointmentType === "video" ? "WhatsApp / Google Meet" : practitioner.location
      }`,
      `Frais estimés: ${practitioner.fee}`,
    ].join("\n");

    downloadBlob("recap-rdv-melanis.txt", "text/plain;charset=utf-8", recap);
    setFeedback("Récapitulatif téléchargé");
  };

  const handleShare = async () => {
    const shareText = `Rendez-vous Melanis confirmé: ${selectedSlot.date} à ${selectedSlot.time} avec ${practitioner.name}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Rendez-vous Melanis",
          text: shareText,
        });
        setFeedback("Détails partagés");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setFeedback("Détails copiés dans le presse-papiers");
        return;
      }

      setFeedback("Partage non disponible sur cet appareil");
    } catch {
      setFeedback("Partage annulé");
    }
  };

  const handleEditCancel = () => {
    navigate("/patient-flow/detail-confirmation", {
      state: {
        ...state,
        actingProfileId: auth.actingProfileId,
        actingRelationship: auth.actingProfile?.relationship,
      },
    });
  };

  const openLogisticsLink = () => {
    if (appointmentType === "video") {
      window.open("https://meet.google.com/", "_blank", "noopener,noreferrer");
      return;
    }

    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(
      practitioner.location
    )}`;
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PageLayout>
      <div className="pf-page flex h-full flex-col">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="pf-header flex items-center justify-between px-4 md:px-8 pt-2 md:pt-4"
        >
          <HeaderBack onBack={() => navigate(-1)} />
          <StepIndicator current={5} total={5} />
          <div className="w-[44px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.04, ease: "easeOut" }}
          className="px-5 md:px-8 mt-2"
        >
          <PersistentContextBar
            profileId={auth.actingProfileId}
            profileLabel={
              auth.actingProfile
                ? `${auth.actingProfile.firstName} ${auth.actingProfile.lastName}`
                : null
            }
            profileOptions={profileOptions}
            onProfileChange={(profileId) => {
              void auth.setActingProfile(profileId);
            }}
            appointmentType={appointmentType}
            practitionerName={practitioner.name}
            dateLabel={state?.date ? formatDateLabel(state.date) : selectedSlot.date}
            timeLabel={state?.time ?? selectedSlot.time}
          />
        </motion.div>

        <div className="pf-scroll flex-1 min-h-0 overflow-y-auto px-5 md:px-8 pb-6 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="pt-7 text-center"
          >
            <div className="mx-auto h-[86px] w-[86px] rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,65,94,0.14) 0%, rgba(0,65,94,0.04) 65%, rgba(0,65,94,0) 100%)",
              }}
            >
              <CheckCircle2 className="h-[42px] w-[42px] text-[#00415E]" strokeWidth={1.8} />
            </div>
            <h1 className="mt-4 text-[24px] text-[#111214]" style={{ fontWeight: 590 }}>
              Rendez-vous confirmé
            </h1>
            <p className="mt-2 text-[14px] text-[rgba(17,18,20,0.52)]" style={{ fontWeight: 470 }}>
              Toutes les informations sont prêtes. Vous pouvez maintenant préparer la consultation.
            </p>
          </motion.div>

          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className="mt-6 space-y-4"
              >
                <section
                  className="rounded-[20px] px-4 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(91,17,18,0.04) 0%, rgba(254,240,213,0.26) 100%)",
                    border: "1px solid rgba(91,17,18,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] text-[#111214]" style={{ fontWeight: 560 }}>
                        {practitioner.name}
                      </p>
                      <p className="text-[12px] text-[rgba(17,18,20,0.48)]" style={{ fontWeight: 470 }}>
                        {practitioner.specialty}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px]"
                      style={{
                        background: "rgba(0,65,94,0.1)",
                        color: "#00415E",
                        fontWeight: 550,
                      }}
                    >
                      {appointmentType === "video" ? "Vidéo" : "Présentiel"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-[12px] bg-white px-3 py-2.5">
                      <p className="text-[11px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 520 }}>
                        Date
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#111214]" style={{ fontWeight: 530 }}>
                        {selectedSlot.date}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white px-3 py-2.5">
                      <p className="text-[11px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 520 }}>
                        Heure
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#111214]" style={{ fontWeight: 530 }}>
                        {selectedSlot.time}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white px-3 py-2.5 col-span-2">
                      <p className="text-[11px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 520 }}>
                        Frais estimés
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#111214]" style={{ fontWeight: 530 }}>
                        {practitioner.fee}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <ActionCard
                    icon={CalendarPlus2}
                    title="Ajouter au calendrier"
                    subtitle="Crée un rappel automatique"
                    onClick={handleAddCalendar}
                    index={0}
                  />
                  <ActionCard
                    icon={Download}
                    title="Télécharger récap"
                    subtitle="Fichier texte avec les détails du RDV"
                    onClick={handleDownloadRecap}
                    index={1}
                  />
                  <ActionCard
                    icon={Share2}
                    title="Partager"
                    subtitle="Envoyer les détails à un proche"
                    onClick={handleShare}
                    index={2}
                  />
                  <ActionCard
                    icon={Pencil}
                    title="Modifier ou annuler"
                    subtitle="Accéder rapidement au récapitulatif"
                    onClick={handleEditCancel}
                    index={3}
                  />
                </section>

                <section
                  className="rounded-[18px] bg-white px-4 py-4"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(17,18,20,0.03), 0 2px 8px rgba(17,18,20,0.02)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-[16px] w-[16px] text-[#00415E]" strokeWidth={1.8} />
                      <p className="text-[14px] text-[#111214]" style={{ fontWeight: 560 }}>
                        Reminder & prep center
                      </p>
                    </div>
                    <span className="text-[11.5px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 530 }}>
                      {checklistProgress}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <ChecklistItem
                      checked={prepChecklist.documents}
                      text="Préparer ordonnances et analyses"
                      onToggle={() => toggleChecklist("documents")}
                    />
                    <ChecklistItem
                      checked={prepChecklist.paiement}
                      text="Prévoir le moyen de paiement"
                      onToggle={() => toggleChecklist("paiement")}
                    />
                    <ChecklistItem
                      checked={prepChecklist.questions}
                      text="Noter les questions importantes"
                      onToggle={() => toggleChecklist("questions")}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <button
                      onClick={openLogisticsLink}
                      className="rounded-[12px] border border-[rgba(0,65,94,0.14)] bg-[rgba(0,65,94,0.03)] px-3 py-2.5 text-left cursor-pointer transition-colors hover:bg-[rgba(0,65,94,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <div className="flex items-center gap-2">
                        {appointmentType === "video" ? (
                          <Video className="h-[14px] w-[14px] text-[#00415E]" strokeWidth={1.8} />
                        ) : (
                          <MapPin className="h-[14px] w-[14px] text-[#00415E]" strokeWidth={1.8} />
                        )}
                        <p className="text-[12.5px] text-[#00415E]" style={{ fontWeight: 540 }}>
                          {appointmentType === "video"
                            ? "Ouvrir le lien de visio"
                            : "Ouvrir l'itinéraire"}
                        </p>
                      </div>
                    </button>

                    <div className="rounded-[12px] border border-[rgba(17,18,20,0.08)] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-[14px] w-[14px] text-[#5B1112]" strokeWidth={1.8} />
                        <p className="text-[12.5px] text-[#111214]" style={{ fontWeight: 540 }}>
                          Préférences de rappel
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {([
                          ["sms", "SMS"],
                          ["whatsapp", "WhatsApp"],
                          ["email", "Email"],
                        ] as Array<[keyof ReminderPrefs, string]>).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setReminder(key)}
                            className="rounded-full px-3 py-1.5 text-[12px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            style={{
                              background: reminderPrefs[key]
                                ? "rgba(0,65,94,0.12)"
                                : "rgba(17,18,20,0.06)",
                              color: reminderPrefs[key]
                                ? "#00415E"
                                : "rgba(17,18,20,0.55)",
                              fontWeight: 530,
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  className="rounded-[18px] px-4 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(91,17,18,0.05) 0%, rgba(254,240,213,0.22) 100%)",
                    border: "1px solid rgba(91,17,18,0.1)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="h-[16px] w-[16px] text-[#5B1112] mt-[1px]" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-[#111214]" style={{ fontWeight: 560 }}>
                        Prévention no-show
                      </p>
                      <p className="mt-1 text-[12.5px] text-[rgba(17,18,20,0.55)]" style={{ fontWeight: 470 }}>
                        Activez la confirmation 24h avant et gardez la fiche d'accueil complète.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => setConfirm24h((prev) => !prev)}
                      className="w-full rounded-[12px] bg-white px-3 py-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
                    >
                      <p className="text-[12.5px] text-[#111214]" style={{ fontWeight: 540 }}>
                        Confirmation automatique 24h avant: {confirm24h ? "Activée" : "Désactivée"}
                      </p>
                    </button>

                    {!hasPreConsult && intakeNudge && (
                      <button
                        onClick={() => {
                          setIntakeNudge(false);
                          navigate("/patient-flow/confirmation", {
                            state: {
                              ...state,
                              actingProfileId: auth.actingProfileId,
                              actingRelationship: auth.actingProfile?.relationship,
                            },
                          });
                        }}
                        className="w-full rounded-[12px] bg-white px-3 py-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-[14px] w-[14px] text-[#5B1112]" strokeWidth={1.8} />
                          <p className="text-[12.5px] text-[#111214]" style={{ fontWeight: 540 }}>
                            Compléter la fiche pré-consultation
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="pf-cta px-5 md:px-8 pb-5 pt-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}
        >
          <button
            onClick={() => navigate("/patient-flow")}
            className="pf-primary-cta w-full rounded-[16px] py-4 text-[#FEF0D5] transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
            style={{
              background: "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)",
              boxShadow:
                "0 4px 16px rgba(91,17,18,0.25), 0 2px 4px rgba(91,17,18,0.15)",
              fontWeight: 560,
            }}
          >
            <Home className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Retour à l'accueil
          </button>

          <button
            onClick={() => navigate("/patient-flow")}
            className="mt-3 w-full py-2.5 text-[13px] text-[rgba(17,18,20,0.4)] transition-colors hover:text-[rgba(17,18,20,0.58)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
            style={{ fontWeight: 500 }}
          >
            Prendre un autre rendez-vous
          </button>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="rounded-full bg-[#111214] px-4 py-2.5 text-[12.5px] text-white"
              style={{
                boxShadow:
                  "0 4px 20px rgba(17,18,20,0.22), 0 1px 4px rgba(17,18,20,0.1)",
                fontWeight: 520,
              }}
            >
              {feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
