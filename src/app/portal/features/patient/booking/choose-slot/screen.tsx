import { useCallback, useEffect, useMemo, useState } from "react";
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
import { PersistentContextBar } from "@portal/shared/components/PersistentContextBar";
import { motion } from "motion/react";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { schedulingAdapter } from "@portal/domains/runtime/adapters";
import type {
  AvailabilitySlotRecord,
  PractitionerDirectoryEntry,
} from "@portal/domains/scheduling/types";
import { useAuth } from "@portal/session/useAuth";

type DateChip = {
  key: string;
  dayLabel: string;
  dateNum: number;
  monthLabel: string;
  isToday?: boolean;
  hasSlots?: boolean;
};

type FilterKey = "all" | "matin" | "aprem" | "soir";

type BookingRouteState = {
  appointmentType?: "presentiel" | "video";
  actingProfileId?: string;
  actingRelationship?: "moi" | "enfant" | "proche";
};

type SlotButton = {
  id: string;
  time: string;
  available: boolean;
  period: FilterKey;
  startsAt: string;
};

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "matin", label: "Matin" },
  { key: "aprem", label: "Après-midi" },
  { key: "soir", label: "Soir" },
];

const INITIAL_RANGE_DAYS = 14;

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildDateWindow(dayCount: number, availableDateKeys: Set<string>): DateChip[] {
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
  return Array.from({ length: dayCount }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);
    const key = current.toISOString().slice(0, 10);
    return {
      key,
      dayLabel: days[current.getDay()],
      dateNum: current.getDate(),
      monthLabel: months[current.getMonth()],
      isToday: index === 0,
      hasSlots: availableDateKeys.has(key),
    };
  });
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

export default function ChooseSlotScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const routeState = (location.state ?? {}) as BookingRouteState;

  const appointmentType = routeState.appointmentType ?? "presentiel";
  const [practitioners, setPractitioners] = useState<PractitionerDirectoryEntry[]>([]);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlotRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [rangeDays, setRangeDays] = useState(INITIAL_RANGE_DAYS);
  const [loadingPractitioners, setLoadingPractitioners] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSelectionError, setShowSelectionError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoadingPractitioners(true);
        setErrorMessage(null);
        const list = await schedulingAdapter.listPractitioners(appointmentType);
        if (cancelled) return;
        setPractitioners(list);
        setSelectedPractitionerId((current) => {
          if (current && list.some((item) => item.practitionerId === current)) {
            return current;
          }
          return list[0]?.practitionerId ?? null;
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les praticiens.",
          );
          setPractitioners([]);
          setSelectedPractitionerId(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPractitioners(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [appointmentType]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!selectedPractitionerId) {
        setAvailabilitySlots([]);
        setSelectedDate("");
        setSelectedTime(null);
        return;
      }

      try {
        setLoadingSlots(true);
        setErrorMessage(null);
        const slots = await schedulingAdapter.listAvailability({
          practitionerId: selectedPractitionerId,
          appointmentType,
          dateFrom: todayDateKey(),
          days: rangeDays,
        });
        if (cancelled) return;
        setAvailabilitySlots(slots.filter((slot) => slot.isAvailable));

        const availableDateKeys = new Set(
          slots.filter((slot) => slot.isAvailable).map((slot) => slot.dateKey),
        );
        let resolvedDateKey = "";
        setSelectedDate((current) => {
          if (current && availableDateKeys.has(current)) {
            resolvedDateKey = current;
            return current;
          }
          resolvedDateKey = slots.find((slot) => slot.isAvailable)?.dateKey ?? "";
          return resolvedDateKey;
        });
        setSelectedTime((current) => {
          if (!current) return null;
          const stillAvailable = slots.some(
            (slot) =>
              slot.isAvailable &&
              slot.dateKey === resolvedDateKey &&
              slot.timeLabel === current,
          );
          return stillAvailable ? current : null;
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les disponibilités.",
          );
          setAvailabilitySlots([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [appointmentType, rangeDays, reloadKey, selectedPractitionerId]);

  const selectedPractitioner = useMemo(
    () =>
      practitioners.find((item) => item.practitionerId === selectedPractitionerId) ?? null,
    [practitioners, selectedPractitionerId],
  );

  const availableDateKeys = useMemo(
    () => new Set(availabilitySlots.map((slot) => slot.dateKey)),
    [availabilitySlots],
  );

  const dates = useMemo(
    () => buildDateWindow(rangeDays, availableDateKeys),
    [availableDateKeys, rangeDays],
  );

  const slots = useMemo<SlotButton[]>(() => {
    const selectedDateSlots = availabilitySlots.filter((slot) => slot.dateKey === selectedDate);
    const mapped = selectedDateSlots.map((slot) => ({
      id: slot.id,
      time: slot.timeLabel,
      available: slot.isAvailable,
      period: periodFromTime(slot.timeLabel),
      startsAt: slot.startsAt,
    }));
    if (activeFilter === "all") {
      return mapped;
    }
    return mapped.filter((slot) => slot.period === activeFilter);
  }, [activeFilter, availabilitySlots, selectedDate]);

  const bestNextSlot = useMemo(() => {
    const first = availabilitySlots[0];
    if (!first) return null;
    return {
      id: first.id,
      dateKey: first.dateKey,
      time: first.timeLabel,
      startsAt: first.startsAt,
      period: periodFromTime(first.timeLabel),
      label: `${formatDateLabel(first.dateKey)} · ${first.timeLabel}`,
    };
  }, [availabilitySlots]);

  const selectedDateLabel = useMemo(
    () => (selectedDate ? formatDateLabel(selectedDate) : "À définir"),
    [selectedDate],
  );

  const canContinue = Boolean(selectedPractitioner && selectedDate && selectedTime);

  const handleDateSelect = (key: string) => {
    setSelectedDate(key);
    setSelectedTime((current) => {
      if (!current) return null;
      const stillAvailable = availabilitySlots.some(
        (slot) => slot.dateKey === key && slot.timeLabel === current,
      );
      return stillAvailable ? current : null;
    });
    setActiveFilter("all");
    setShowSelectionError(false);
  };

  const handleFilterSelect = (key: string) => {
    setActiveFilter(key as FilterKey);
  };

  const handleBestSlot = () => {
    if (!bestNextSlot) return;
    setSelectedDate(bestNextSlot.dateKey);
    setActiveFilter(bestNextSlot.period);
    setSelectedTime(bestNextSlot.time);
    setShowSelectionError(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowSelectionError(false);
  };

  const handleRetry = () => {
    setReloadKey((current) => current + 1);
  };

  const handleNextDays = useCallback(() => {
    const currentIndex = dates.findIndex((date) => date.key === selectedDate);
    const nextWithSlots = dates.find(
      (date, index) => index > currentIndex && date.hasSlots,
    );
    if (nextWithSlots) {
      setSelectedDate(nextWithSlots.key);
      setSelectedTime(null);
      setActiveFilter("all");
      return;
    }
    setRangeDays((current) => current + 7);
  }, [dates, selectedDate]);

  const handleContinue = () => {
    if (!canContinue || !selectedPractitioner) {
      setShowSelectionError(true);
      return;
    }

    const selectedSlot = availabilitySlots.find(
      (slot) => slot.dateKey === selectedDate && slot.timeLabel === selectedTime,
    );
    if (!selectedSlot) {
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
        availabilitySlotId: selectedSlot.id,
        practitioner: selectedPractitioner,
        selectedSlot: {
          date: formatLongDate(selectedDate),
          time: selectedTime,
          startsAt: selectedSlot.startsAt,
        },
      },
    });
  };

  return (
    <PageLayout>
      <div className="pf-page flex flex-col h-full">
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
            practitionerName={selectedPractitioner?.displayName ?? null}
            dateLabel={selectedDateLabel}
            timeLabel={selectedTime ?? "À définir"}
          />
        </motion.div>

        <div className="pf-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-6 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="flex items-center mt-5 md:mt-4 pl-5 pr-0 md:pl-8 md:pr-2"
          >
            <div className="flex-1 mr-2 overflow-visible">
              <QuestionBubble
                title="Choisir un praticien et un créneau"
                subtitle="Sélectionnez un dermatologue, puis une date et une heure disponibles."
                tailSide="right"
              />
            </div>
            <div className="pf-mascot flex-shrink-0 -mr-2.5 md:mr-2">
              <MelaniaMascot size={68} />
            </div>
          </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
            className="px-5 md:px-8 mt-5 md:mt-4 space-y-3"
          >
            {loadingPractitioners ? (
              <div className="rounded-[20px] bg-white p-4 text-sm text-[rgba(17,18,20,0.55)]">
                Chargement des praticiens...
              </div>
            ) : practitioners.length === 0 ? (
              <div className="rounded-[20px] bg-white p-4 text-sm text-[#8A2E2E]">
                {errorMessage ?? "Aucun praticien disponible."}
              </div>
            ) : (
              practitioners.map((practitioner) => {
                const isSelected = practitioner.practitionerId === selectedPractitionerId;
                return (
                  <button
                    key={practitioner.practitionerId}
                    onClick={() => {
                      setSelectedPractitionerId(practitioner.practitionerId);
                      setSelectedTime(null);
                      setSelectedDate("");
                      setActiveFilter("all");
                      setShowSelectionError(false);
                    }}
                    className="block w-full rounded-[24px] text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
                    style={{
                      border: isSelected
                        ? "2px solid rgba(91,17,18,0.24)"
                        : "2px solid transparent",
                      boxShadow: isSelected ? "0 8px 20px rgba(91,17,18,0.08)" : "none",
                    }}
                  >
                    <PractitionerMiniCard
                      name={practitioner.displayName}
                      specialty={practitioner.specialty}
                      rating={practitioner.rating}
                      reviewCount={practitioner.reviewCount}
                      photoUrl={practitioner.photoUrl}
                      availableToday={practitioner.availableToday}
                      priceFrom={practitioner.priceFromLabel}
                    />
                  </button>
                );
              })
            )}
          </motion.div>

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
              onShowMore={() => setRangeDays((current) => current + 7)}
            />
          </motion.div>

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

          {showSelectionError ? (
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
                  Sélectionnez un praticien et une heure disponible pour continuer.
                </p>
              </div>
            </motion.div>
          ) : null}

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
              loading={loadingSlots}
              error={Boolean(errorMessage) && !loadingSlots}
              errorMessage={errorMessage ?? undefined}
              selectedDateLabel={selectedDateLabel}
              onRetry={handleRetry}
              onNextDays={handleNextDays}
            />
          </motion.div>

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

          {appointmentType === "video" ? (
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
          ) : null}
        </div>

        <div
          className="pf-cta shrink-0 px-5 md:px-8 pb-2 pt-3 bg-[#FAFAFA] border-t border-[rgba(17,18,20,0.04)]"
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

          <div className="flex justify-center pt-2 md:hidden">
            <div className="w-[134px] h-[5px] bg-[rgba(17,18,20,0.12)] rounded-full" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
