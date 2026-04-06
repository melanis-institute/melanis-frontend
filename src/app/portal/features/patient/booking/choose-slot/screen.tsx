import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Wifi, Globe, Sparkles, AlertTriangle } from "lucide-react";
import { HeaderBack } from "@portal/shared/components/HeaderBack";
import { QuestionBubble } from "@portal/shared/components/QuestionBubble";
import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import { StepIndicator } from "@portal/shared/components/StepIndicator";
import { PageLayout } from "@portal/shared/layouts/PageLayout";
import { PractitionerMiniCard } from "@portal/shared/components/PractitionerMiniCard";
import { DateChipSelector } from "@portal/shared/components/DateChipSelector";
import { FilterChips } from "@portal/shared/components/FilterChips";
import { TimeSlotGrid } from "@portal/shared/components/TimeSlotGrid";
import {
  PersistentContextBar,
} from "@portal/shared/components/PersistentContextBar";
import { motion } from "motion/react";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

// --- Mock data ---

const PRACTITIONER = {
  name: "Dr. Aïssatou Diallo",
  specialty: "Dermatologie",
  rating: 4.9,
  reviewCount: 214,
  photoUrl:
    "https://images.unsplash.com/photo-1655720357761-f18ea9e5e7e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmVtYWxlJTIwZGVybWF0b2xvZ2lzdCUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTYxODk3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  availableToday: true,
  priceFrom: "À partir de 15 000 FCFA",
};

type DateChip = {
  key: string;
  dayLabel: string;
  dateNum: number;
  monthLabel: string;
  isToday?: boolean;
  hasSlots?: boolean;
};

type FilterKey = "all" | "matin" | "aprem" | "soir";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "matin", label: "Matin" },
  { key: "aprem", label: "Après-midi" },
  { key: "soir", label: "Soir" },
];

function generateDates(startOffset: number, count: number): DateChip[] {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "Janv",
    "Fév",
    "Mars",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sept",
    "Oct",
    "Nov",
    "Déc",
  ];

  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() + startOffset + index);
    const isSunday = d.getDay() === 0;
    return {
      key: d.toISOString().split("T")[0],
      dayLabel: days[d.getDay()],
      dateNum: d.getDate(),
      monthLabel: months[d.getMonth()],
      isToday: startOffset + index === 0,
      hasSlots: !isSunday,
    };
  });
}

function generateSlots(dateKey: string, filter: FilterKey) {
  const d = new Date(dateKey);
  if (d.getDay() === 0) return [];

  const allSlots = [
    { time: "08:00", available: true, period: "matin" as const },
    { time: "08:30", available: false, period: "matin" as const },
    { time: "09:00", available: true, period: "matin" as const },
    { time: "09:30", available: true, period: "matin" as const },
    { time: "10:00", available: true, period: "matin" as const },
    { time: "10:30", available: false, period: "matin" as const },
    { time: "11:00", available: true, period: "matin" as const },
    { time: "11:30", available: true, period: "matin" as const },
    { time: "14:00", available: true, period: "aprem" as const },
    { time: "14:30", available: true, period: "aprem" as const },
    { time: "15:00", available: false, period: "aprem" as const },
    { time: "15:30", available: true, period: "aprem" as const },
    { time: "16:00", available: true, period: "aprem" as const },
    { time: "16:30", available: true, period: "aprem" as const },
    { time: "18:00", available: true, period: "soir" as const },
    { time: "18:30", available: false, period: "soir" as const },
    { time: "19:00", available: true, period: "soir" as const },
  ];

  if (filter === "all") return allSlots;
  return allSlots.filter((slot) => slot.period === filter);
}

function formatDateLabel(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatLongDate(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function periodFromTime(time: string): FilterKey {
  const [hour] = time.split(":").map(Number);
  if (hour < 12) return "matin";
  if (hour < 18) return "aprem";
  return "soir";
}

const INITIAL_DATES = generateDates(0, 10);

export default function PF02() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const routeState = (location.state ?? {}) as {
    appointmentType?: "presentiel" | "video";
    actingProfileId?: string;
    actingRelationship?: "moi" | "enfant" | "proche";
  };

  const appointmentType = routeState.appointmentType ?? "presentiel";

  const [dates, setDates] = useState<DateChip[]>(INITIAL_DATES);
  const [selectedDate, setSelectedDate] = useState<string>(
    INITIAL_DATES[0]?.key ?? ""
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showSelectionError, setShowSelectionError] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLoading = useCallback(() => {
    setLoading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => setLoading(false), 420);
  }, []);

  useEffect(
    () => () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    },
    []
  );

  const slots = useMemo(
    () => generateSlots(selectedDate, activeFilter),
    [selectedDate, activeFilter]
  );

  const selectedDateLabel = useMemo(
    () => (selectedDate ? formatDateLabel(selectedDate) : "À définir"),
    [selectedDate]
  );

  const bestNextSlot = useMemo(() => {
    for (const date of dates) {
      const firstAvailable = generateSlots(date.key, "all").find(
        (slot) => slot.available
      );
      if (firstAvailable) {
        return {
          dateKey: date.key,
          time: firstAvailable.time,
          period: periodFromTime(firstAvailable.time),
          label: `${formatDateLabel(date.key)} · ${firstAvailable.time}`,
        };
      }
    }
    return null;
  }, [dates]);

  const extendBySevenDays = useCallback(() => {
    setDates((prev) => [...prev, ...generateDates(prev.length, 7)]);
  }, []);

  const handleDateSelect = (key: string) => {
    const nextDateSlots = generateSlots(key, "all");
    if (
      selectedTime &&
      !nextDateSlots.some((slot) => slot.available && slot.time === selectedTime)
    ) {
      setSelectedTime(null);
    }
    setSelectedDate(key);
    setActiveFilter("all");
    setError(false);
    triggerLoading();
    setShowSelectionError(false);
  };

  const handleFilterSelect = (key: string) => {
    setActiveFilter(key as FilterKey);
    setError(false);
    triggerLoading();
  };

  const handleRetry = () => {
    setError(false);
    triggerLoading();
  };

  const findNextAvailableDate = (datePool: DateChip[], fromKey: string) => {
    const currentIndex = datePool.findIndex((date) => date.key === fromKey);
    return datePool.find(
      (date, index) => index > currentIndex && date.hasSlots !== false
    );
  };

  const handleNextDays = () => {
    const nextDate = findNextAvailableDate(dates, selectedDate);
    if (nextDate) {
      setSelectedDate(nextDate.key);
      setActiveFilter("all");
      setError(false);
      triggerLoading();
      return;
    }

    const extended = [...dates, ...generateDates(dates.length, 7)];
    setDates(extended);
    const nextAfterExtend = findNextAvailableDate(extended, selectedDate);
    if (nextAfterExtend) {
      setSelectedDate(nextAfterExtend.key);
      setActiveFilter("all");
      setError(false);
      triggerLoading();
    }
  };

  const handleBestSlot = () => {
    if (!bestNextSlot) return;
    setSelectedDate(bestNextSlot.dateKey);
    setActiveFilter(bestNextSlot.period);
    setSelectedTime(bestNextSlot.time);
    setError(false);
    triggerLoading();
    setShowSelectionError(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowSelectionError(false);
  };

  const canContinue = Boolean(selectedDate && selectedTime);
  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));

  const handleContinue = () => {
    if (!canContinue) {
      setShowSelectionError(true);
      return;
    }

    navigate("/patient-flow/confirmation", {
      state: {
        appointmentType,
        actingProfileId: auth.actingProfileId,
        actingRelationship: auth.actingProfile?.relationship,
        date: selectedDate,
        time: selectedTime,
        selectedSlot: {
          date: formatLongDate(selectedDate),
          time: selectedTime,
        },
      },
    });
  };

  return (
    <PageLayout>
      <div className="pf-page flex flex-col h-full">
        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pf-header flex items-center justify-between px-4 md:px-8 pt-2 md:pt-4"
        >
          <HeaderBack onBack={() => navigate(-1)} />
          <StepIndicator current={2} total={5} />
          <div className="w-[44px]" aria-hidden="true" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className="px-5 md:px-8 mt-2 md:mt-3"
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
            practitionerName={PRACTITIONER.name}
            dateLabel={selectedDateLabel}
            timeLabel={selectedTime ?? "À définir"}
          />
        </motion.div>

        {/* Scrollable content area */}
        <div className="pf-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-6 md:pb-8">
          {/* Mascot + Question Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="flex items-center mt-5 md:mt-4 pl-5 pr-0 md:pl-8 md:pr-2"
          >
            <div className="flex-1 mr-2 overflow-visible">
              <QuestionBubble
                title="Choisir un créneau"
                subtitle="Sélectionnez une date puis une heure disponible."
                tailSide="right"
              />
            </div>
            <div className="pf-mascot flex-shrink-0 -mr-2.5 md:mr-2">
              <MelaniaMascot size={68} />
            </div>
          </motion.div>

          {/* Best next slot */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4"
          >
            <button
              onClick={handleBestSlot}
              disabled={!bestNextSlot}
              className="w-full rounded-[16px] px-4 py-3.5 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,65,94,0.06) 0%, rgba(254,240,213,0.32) 100%)",
                border: "1px solid rgba(0,65,94,0.12)",
                opacity: bestNextSlot ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-[15px] w-[15px] text-[#00415E]" strokeWidth={1.8} />
                <p className="text-[13px] text-[#00415E]" style={{ fontWeight: 560 }}>
                  Meilleur prochain créneau
                </p>
              </div>
              <p className="mt-1 text-[13.5px] text-[rgba(17,18,20,0.72)]" style={{ fontWeight: 500 }}>
                {bestNextSlot ? bestNextSlot.label : "Aucun créneau prochain"}
              </p>
            </button>
          </motion.div>

          {/* Practitioner mini-card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4"
          >
            <PractitionerMiniCard {...PRACTITIONER} />
          </motion.div>

          {/* Date selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4"
          >
            <DateChipSelector
              dates={dates}
              selectedKey={selectedDate}
              onSelect={handleDateSelect}
              onShowMore={extendBySevenDays}
            />
          </motion.div>

          {/* Filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4"
          >
            <FilterChips
              filters={FILTERS}
              activeKey={activeFilter}
              onSelect={handleFilterSelect}
            />
          </motion.div>

          {/* Error summary */}
          {showSelectionError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 md:px-8 mt-4"
            >
              <div
                className="flex items-start gap-2.5 rounded-[14px] px-3.5 py-3"
                style={{
                  background: "rgba(91,17,18,0.08)",
                  border: "1px solid rgba(91,17,18,0.14)",
                }}
                role="alert"
                aria-live="polite"
              >
                <AlertTriangle className="h-4 w-4 text-[#5B1112] mt-[1px]" strokeWidth={1.9} />
                <p className="text-[12.5px] text-[#5B1112]" style={{ fontWeight: 520 }}>
                  Sélectionnez une heure disponible pour continuer.
                </p>
              </div>
            </motion.div>
          )}

          {/* Time slots */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.36, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4"
          >
            <TimeSlotGrid
              slots={slots}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
              loading={loading}
              error={error}
              selectedDateLabel={selectedDateLabel}
              onRetry={handleRetry}
              onNextDays={handleNextDays}
            />
          </motion.div>

          {/* Timezone indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="flex items-center gap-1.5 px-5 md:px-8 mt-3"
          >
            <Globe
              className="w-[12px] h-[12px] text-[rgba(17,18,20,0.25)]"
              strokeWidth={1.8}
            />
            <span className="text-[11px] text-[rgba(17,18,20,0.3)]">
              Heure locale Dakar (GMT+0)
            </span>
          </motion.div>

          {/* Video consultation microcopy */}
          {appointmentType === "video" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-2 px-5 md:px-8 mt-5"
            >
              <Wifi
                className="w-[14px] h-[14px] text-[rgba(0,65,94,0.5)] mt-0.5 flex-shrink-0"
                strokeWidth={1.8}
              />
              <p className="text-[12px] text-[rgba(17,18,20,0.4)] leading-[1.5]">
                Assurez-vous d&apos;avoir une bonne connexion internet pour votre
                vidéo consultation.
              </p>
            </motion.div>
          )}
        </div>

        {/* Fixed CTA at bottom */}
        <div
          className="
            pf-cta
            shrink-0
            px-5 md:px-8 pb-2 pt-3
            bg-[#FAFAFA]
            border-t border-[rgba(17,18,20,0.04)]
          "
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          }}
        >
          <motion.button
            initial={false}
            animate={{
              opacity: canContinue ? 1 : 0.72,
              scale: canContinue ? 1 : 0.99,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={handleContinue}
            className={`
              pf-primary-cta
              w-full h-[52px] rounded-[16px] text-white text-[16px] tracking-[-0.2px]
              transition-all duration-200 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
              ${canContinue ? "active:scale-[0.98]" : ""}
            `}
            style={{
              background: canContinue
                ? "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)"
                : "#5B1112",
              boxShadow: canContinue
                ? "0 2px 8px rgba(91, 17, 18, 0.2), 0 1px 3px rgba(17, 18, 20, 0.06)"
                : "none",
              fontWeight: 600,
            }}
          >
            Continuer
          </motion.button>

          {/* Home indicator (mobile only) */}
          <div className="flex justify-center pt-2 md:hidden">
            <div className="w-[134px] h-[5px] bg-[rgba(17,18,20,0.12)] rounded-full" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
