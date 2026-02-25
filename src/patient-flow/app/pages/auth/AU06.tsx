import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CloudSun,
  Droplets,
  FileText,
  Home,
  ImagePlus,
  LogOut,
  Pill,
  Plus,
  RotateCcw,
  ScanFace,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Video,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { MelaniaMascot } from "../../components/MelaniaMascot";
import type {
  NotificationChannelPreference,
  PatientRecordEvent,
  ScreeningCadence,
  ScreeningReminder,
  ScreeningReminderStatus,
} from "../../account/types";

const DASHBOARD_PATH = "/patient-flow/auth/dashboard";
const PROFILE_PATH = "/patient-flow/account";
const BOOKING_PATH = "/patient-flow";

const PATHS = {
  home: DASHBOARD_PATH,
  appointments: `${DASHBOARD_PATH}#appointments`,
  records: `${DASHBOARD_PATH}#records`,
  profile: PROFILE_PATH,
  scan: `${DASHBOARD_PATH}#scan`,
  photos: `${DASHBOARD_PATH}#photos`,
  cases: BOOKING_PATH,
  booking: BOOKING_PATH,
} as const;

const CADENCE_LABELS: Record<ScreeningCadence, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semiannual: "Semestriel",
  annual: "Annuel",
};

const STATUS_LABELS: Record<ScreeningReminderStatus, string> = {
  active: "Actif",
  snoozed: "En pause",
  completed: "Terminé",
};

interface UpcomingAppointment {
  practitioner: string;
  location: string;
  dateLabel: string;
  timeLabel: string;
  isVideo: boolean;
}

interface DashboardLayoutProps {
  fullName: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

interface DashboardHomeProps {
  firstName: string;
  upcoming: UpcomingAppointment;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "Fatou";
  const [first] = fullName.trim().split(/\s+/);
  return first || "Fatou";
}

function formatTimeLabel(value?: string): string {
  if (!value) return "14h30";
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return trimmed.replace(":", "h");
  }
  return trimmed;
}

function parseMinutesUntil(timeLabel: string): number | null {
  const normalized = timeLabel.trim().toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/^(\d{1,2})(?:h|:)(\d{2})$/);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  return Math.round((target.getTime() - now.getTime()) / 60000);
}

function isLikelyToday(label: string): boolean {
  return label.trim().toLowerCase().includes("aujourd");
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeFromNow(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return `${Math.abs(diffMinutes)} min`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)} h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)} j`;
}

function timelineIcon(type: PatientRecordEvent["type"]): LucideIcon {
  if (type === "appointment_booked") return Calendar;
  if (type === "consent_signed" || type === "consent_revoked") return Bell;
  if (type === "profile_updated") return User;
  if (type === "dependent_created" || type === "dependent_unlinked") return Plus;
  return Activity;
}

function reminderStatusTone(status: ScreeningReminderStatus) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "snoozed") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-[#111214]/10 bg-[#111214]/5 text-[#111214]/60";
}

function channelSummary(channels: NotificationChannelPreference) {
  const labels: string[] = [];
  if (channels.sms) labels.push("SMS");
  if (channels.whatsapp) labels.push("WhatsApp");
  if (channels.email) labels.push("Email");
  return labels.length > 0 ? labels.join(" · ") : "Aucun canal";
}

function isPathActive(locationPathname: string, locationHash: string, target: string, exact = true): boolean {
  const [targetPath, targetHash] = target.split("#");
  const targetHashValue = targetHash ? `#${targetHash}` : "";

  const pathMatch = exact
    ? locationPathname === targetPath
    : locationPathname === targetPath || locationPathname.startsWith(`${targetPath}/`);

  if (!pathMatch) return false;
  if (targetHashValue) return locationHash === targetHashValue;
  if (exact) return locationHash.length === 0;
  return true;
}

function SidebarItem({
  icon: Icon,
  label,
  path,
  isActive,
}: {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
}) {
  return (
    <Link to={path} className="mb-1 block">
      <div
        className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-all duration-300 ${
          isActive
            ? "bg-[#5B1112] text-white shadow-xl shadow-[#5B1112]/25"
            : "text-[#111214]/50 hover:bg-white/60 hover:text-[#5B1112]"
        }`}
      >
        <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
        <span className="text-sm font-medium tracking-wide">{label}</span>
        {isActive ? (
          <motion.div
            layoutId="sidebar-pip"
            className="absolute right-3.5 h-1.5 w-1.5 rounded-full bg-white/70"
          />
        ) : null}
      </div>
    </Link>
  );
}

function BottomNavItem({
  icon: Icon,
  label,
  path,
  isActive,
}: {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
}) {
  return (
    <Link to={path} className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2">
      <motion.div
        whileTap={{ scale: 0.85 }}
        className={`relative rounded-2xl p-2 transition-all duration-300 ${
          isActive
            ? "bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/30"
            : "text-[#111214]/35 hover:text-[#5B1112]"
        }`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
      </motion.div>
      <AnimatePresence>
        {isActive ? (
          <motion.span
            key={path}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-[#5B1112]"
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Link>
  );
}

function ScanCenterButton({ isActive }: { isActive: boolean }) {
  return (
    <Link to={PATHS.scan} className="relative flex flex-1 flex-col items-center justify-center py-2">
      <motion.div whileTap={{ scale: 0.9 }} className="relative -translate-y-5">
        {isActive ? (
          <motion.div
            className="absolute inset-0 rounded-full bg-[#5B1112]/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ borderRadius: "50%" }}
          />
        ) : null}

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#FEF0D5] shadow-xl transition-all duration-300 ${
            isActive ? "bg-[#5B1112] shadow-[#5B1112]/40" : "bg-[#111214] shadow-[#111214]/20"
          }`}
        >
          <ScanFace size={22} className="text-white" />
        </div>
      </motion.div>

      <span
        className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
          isActive ? "text-[#5B1112]" : "text-[#111214]/30"
        }`}
      >
        Scan
      </span>
    </Link>
  );
}

export function DashboardLayout({ fullName, onLogout, children }: DashboardLayoutProps) {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Accueil", path: PATHS.home, exact: true },
    { icon: Calendar, label: "Agenda", path: PATHS.appointments, exact: true },
    { icon: FileText, label: "Dossier", path: PATHS.records, exact: true },
    { icon: User, label: "Profil", path: PATHS.profile, exact: true },
  ];

  const isPath = (target: string, exact = true) =>
    isPathActive(location.pathname, location.hash, target, exact);

  const isScan = isPath(PATHS.scan, true);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#FEF0D5] font-sans">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute left-[-4%] top-[-8%] h-[38vw] w-[38vw] rounded-full bg-white/50 opacity-60 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[-4%] h-[42vw] w-[42vw] rounded-full bg-[#5B1112]/4 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FEF0D5]/20 blur-[80px]" />
      </div>

      <aside className="sticky top-0 z-40 hidden h-screen w-[17rem] flex-shrink-0 flex-col p-5 lg:flex">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/55 px-6 pb-6 pt-8 shadow-[0_8px_48px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/30 to-transparent" />

          <div className="relative z-10 mb-10 flex items-center gap-3 px-1">
            <MelaniaMascot size={38} animated delay={0.1} />
            <div>
              <span className="font-serif text-[#111214]" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
                melanis
              </span>
              <div className="-mt-0.5 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] uppercase tracking-wider text-[#111214]/30">En ligne</span>
              </div>
            </div>
          </div>

          <nav className="relative z-10 flex-1 space-y-0.5">
            {[
              ...menuItems.slice(0, 2),
              { icon: ScanFace, label: "Scan IA", path: PATHS.scan, exact: true },
              ...menuItems.slice(2),
            ].map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={isPath(item.path, item.exact)}
              />
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mb-4 rounded-2xl border border-[#FEF0D5] bg-gradient-to-br from-[#FEF0D5]/70 to-[#FEF0D5]/30 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#111214]/30">Score Peau</p>
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp size={10} />
                <span className="text-[10px] font-semibold">+3</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" style={{ width: 44, height: 44 }}>
                <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={22} cy={22} r={17} fill="none" stroke="rgba(91,17,18,0.08)" strokeWidth={5} />
                  <motion.circle
                    cx={22}
                    cy={22}
                    r={17}
                    fill="none"
                    stroke="#5B1112"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 17}
                    initial={{ strokeDashoffset: 2 * Math.PI * 17 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 17 * (1 - 0.78) }}
                    transition={{ delay: 0.8, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-[#5B1112]" style={{ fontSize: 12 }}>
                    78
                  </span>
                </div>
              </div>

              <div>
                <p className="font-serif text-[#111214]" style={{ fontSize: 15 }}>
                  Excellent
                </p>
                <p className="text-[9px] text-[#111214]/40">Hydratation optimale</p>
              </div>
            </div>
          </motion.div>

          <div className="group relative z-10 mb-5 cursor-pointer overflow-hidden rounded-[1.5rem] bg-[#111214] p-5 text-white">
            <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-[#5B1112] opacity-60 blur-xl transition-transform duration-700 group-hover:scale-150" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-1.5">
                <Zap size={12} className="text-[#FEF0D5]" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FEF0D5]/50">Premium</p>
              </div>
              <h4 className="mb-0.5 font-serif text-[#FEF0D5]" style={{ fontSize: 16 }}>
                Melanis+
              </h4>
              <p className="text-[10px] leading-relaxed text-white/40">Suivi IA illimite</p>
            </div>
          </div>

          <div className="relative z-10 border-t border-[#111214]/5 pt-4">
            <div className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white/50">
              <div className="relative flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1584425222858-d013bdda5b54?q=80&w=100&auto=format&fit=crop"
                  alt="Profil"
                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
                />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111214]">{fullName}</p>
                <p className="truncate text-[10px] text-[#111214]/40">Dakar, Senegal</p>
              </div>

              <button
                type="button"
                onClick={() => void onLogout()}
                aria-label="Se deconnecter"
                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/70"
              >
                <LogOut size={15} className="text-[#111214]/25 group-hover:text-[#5B1112]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/30 bg-[#FEF0D5]/85 px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2.5">
            <MelaniaMascot size={34} animated={false} />
            <span className="font-serif text-[#111214]" style={{ fontSize: 18, letterSpacing: "-0.02em" }}>
              melanis
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="rounded-full border border-white/60 bg-white/60 p-2 text-[#111214]/60 shadow-sm transition-colors hover:bg-white">
              <Bell size={18} />
            </button>
            <Link to={PATHS.profile} className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md">
              <img
                src="https://images.unsplash.com/photo-1584425222858-d013bdda5b54?q=80&w=100&auto=format&fit=crop"
                className="h-full w-full object-cover"
                alt="Profil"
              />
            </Link>
          </div>
        </header>

        <header className="hidden items-center justify-between px-10 py-6 lg:flex">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#111214]/30">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h2 className="font-serif text-[#111214]" style={{ fontSize: 22 }}>
              Tableau de bord
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex w-72 items-center rounded-full border border-white/70 bg-white/60 px-4 py-2.5 shadow-sm transition-all focus-within:bg-white focus-within:shadow-md backdrop-blur-md">
              <Search size={16} className="mr-2.5 flex-shrink-0 text-[#111214]/35" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full border-none bg-transparent text-sm text-[#111214] outline-none placeholder:text-[#111214]/35"
              />
            </div>

            <button className="group rounded-full border border-white/70 bg-white/70 p-2.5 text-[#111214]/50 shadow-sm transition-all hover:bg-[#5B1112] hover:text-white">
              <Bell size={18} />
            </button>

            <Link
              to={PATHS.profile}
              className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-105"
            >
              <img
                src="https://images.unsplash.com/photo-1584425222858-d013bdda5b54?q=80&w=100&auto=format&fit=crop"
                className="h-full w-full object-cover"
                alt="Profil"
              />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto h-full max-w-7xl">{children}</div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="mx-3 mb-3 rounded-[2rem] border border-white/60 bg-[#FEF0D5]/90 backdrop-blur-2xl shadow-[0_-4px_40px_rgba(0,0,0,0.06)]">
            <div className="flex h-[4.5rem] items-end justify-around px-2">
              <BottomNavItem
                icon={Home}
                label="Accueil"
                path={PATHS.home}
                isActive={isPath(PATHS.home, true)}
              />
              <BottomNavItem
                icon={Calendar}
                label="Agenda"
                path={PATHS.appointments}
                isActive={isPath(PATHS.appointments, true)}
              />

              <ScanCenterButton isActive={isScan} />

              <BottomNavItem
                icon={FileText}
                label="Dossier"
                path={PATHS.records}
                isActive={isPath(PATHS.records, true)}
              />
              <BottomNavItem
                icon={User}
                label="Profil"
                path={PATHS.profile}
                isActive={isPath(PATHS.profile, true)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SkinScoreRing({ score = 78, size = 72 }: { score?: number; size?: number }) {
  const strokeWidth = size * 0.09;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(91,17,18,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#5B1112"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-serif"
          style={{ fontSize: size * 0.28, lineHeight: 1, color: "#5B1112" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
        >
          {score}
        </motion.span>
        <span
          style={{ fontSize: size * 0.1, color: "rgba(17,18,20,0.35)" }}
          className="mt-0.5 uppercase tracking-widest"
        >
          Score
        </span>
      </div>
    </div>
  );
}

function QuickActions() {
  const auth = useAuth();
  const hasActingProfile = Boolean(auth.user && auth.actingProfileId);
  const modules = [
    {
      Icon: Calendar,
      title: "Réserver un RDV",
      subtitle: "Parcours de réservation",
      to: PATHS.booking,
      available: true,
    },
    {
      Icon: FileText,
      title: "Dossier patient",
      subtitle: "Timeline clinique",
      to: PATHS.records,
      available: true,
    },
    {
      Icon: Bell,
      title: "Rappels dépistage",
      subtitle: "Liste et paramètres",
      to: PATHS.records,
      available: true,
    },
    {
      Icon: User,
      title: "Profil & consentements",
      subtitle: "Compte, consentements, notifications",
      to: PROFILE_PATH,
      available: true,
    },
    {
      Icon: ScanFace,
      title: "Télé-derm async",
      subtitle: "Module TD prochainement",
      to: PATHS.home,
      available: false,
    },
    {
      Icon: ImagePlus,
      title: "Upload guidé",
      subtitle: "Capture assistée en préparation",
      to: PATHS.home,
      available: false,
    },
  ] as const;

  if (!hasActingProfile) {
    return (
      <div className="rounded-[1.5rem] border border-[#5B1112]/15 bg-white/85 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5B1112]/70">
          Hub actions profil
        </p>
        <p className="mt-2 text-sm text-[#111214]/65">
          Sélectionnez d’abord le profil patient actif pour afficher vos actions.
        </p>
        <Link
          to="/patient-flow/account/select-profile"
          state={{ returnTo: PATHS.appointments }}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-medium text-white"
        >
          Sélectionner un profil
          <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
      {modules.map(({ Icon, title, subtitle, to, available }, index) =>
        available ? (
          <Link key={title} to={to}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-[1.4rem] border border-[#111214]/7 bg-white/85 px-4 py-3.5 shadow-sm transition-all hover:border-[#5B1112]/20 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#5B1112]/8 p-2">
                  <Icon size={14} className="text-[#5B1112]/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111214]/75">{title}</p>
                  <p className="mt-1 text-[11px] text-[#111214]/42">{subtitle}</p>
                </div>
                <ArrowUpRight size={12} className="text-[#111214]/30" />
              </div>
            </motion.div>
          </Link>
        ) : (
          <div
            key={title}
            className="rounded-[1.4rem] border border-dashed border-[#111214]/12 bg-white/60 px-4 py-3.5 opacity-80"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-[#111214]/6 p-2">
                <Icon size={14} className="text-[#111214]/45" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111214]/65">{title}</p>
                <p className="mt-1 text-[11px] text-[#111214]/38">{subtitle}</p>
              </div>
              <span className="rounded-full bg-[#111214]/8 px-2 py-0.5 text-[10px] font-medium text-[#111214]/50">
                Bientôt
              </span>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function AppointmentCard({
  delay = 0,
  appointment,
}: {
  delay?: number;
  appointment: UpcomingAppointment;
}) {
  const minsUntil = isLikelyToday(appointment.dateLabel)
    ? parseMinutesUntil(appointment.timeLabel)
    : null;
  const isClose = minsUntil !== null && minsUntil > 0 && minsUntil <= 30;
  const showCountdown = minsUntil !== null && minsUntil > 0 && minsUntil <= 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-[2rem] bg-[#111214] p-6 text-white"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#5B1112]/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-2.5rem] left-1/3 h-36 w-36 rounded-full bg-[#FEF0D5]/4 blur-2xl" />

      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#FEF0D5]/35">
              Prochain Rendez-vous
            </p>
            <h3 className="font-serif" style={{ fontSize: 20 }}>
              {appointment.practitioner}
            </h3>
            <p className="mt-0.5 text-xs text-[#FEF0D5]/45">{appointment.location}</p>
          </div>

          <Link
            to={PATHS.booking}
            className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/15"
          >
            Voir <ArrowUpRight size={10} />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#FEF0D5]">
            {appointment.dateLabel}
          </span>
          <span className="rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#FEF0D5]">
            {appointment.timeLabel}
          </span>
          <span className="rounded-xl bg-[#5B1112]/60 px-3 py-1.5 text-[11px] font-medium text-white/85">
            {appointment.isVideo ? "Video" : "Cabinet"}
          </span>

          {showCountdown ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-[11px] font-medium text-amber-300"
            >
              <Clock size={9} />
              dans {minsUntil} min
            </motion.span>
          ) : null}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`mt-auto flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-sm font-medium transition-all ${
            isClose
              ? "bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/40"
              : "border border-white/8 bg-white/10 text-white/75 hover:bg-white/18"
          }`}
        >
          {isClose && appointment.isVideo ? <Video size={14} /> : <Clock size={14} />}
          {isClose && appointment.isVideo ? "Rejoindre la video" : "Preparer le RDV"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function TodayCard({ delay = 0 }: { delay?: number }) {
  const [activeDay, setActiveDay] = useState(2);

  const baseDate = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - 2 + index);
    return {
      abbr: date
        .toLocaleDateString("fr-FR", { weekday: "short" })
        .replace(".", "")
        .slice(0, 3),
      num: date.getDate().toString().padStart(2, "0"),
    };
  });

  const isToday = activeDay === 2;

  const chips = [
    { Icon: CloudSun, label: "UV 8/12", warn: true },
    { Icon: Droplets, label: "Hydrat. 72%", warn: false },
    { Icon: Wind, label: "Harmattan", warn: false },
    { Icon: Activity, label: "Peau: Bon", warn: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-[2rem] p-6"
      style={{
        background: "linear-gradient(140deg, #fff9f0 0%, #FEF0D5 60%, #fde8be 100%)",
      }}
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#5B1112]/4 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">Aujourd'hui</p>
          <AnimatePresence>
            {!isToday ? (
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                onClick={() => setActiveDay(2)}
                className="flex items-center gap-1 text-[10px] font-medium text-[#5B1112]/65 transition-colors hover:text-[#5B1112]"
              >
                <RotateCcw size={9} />
                Retour a aujourd'hui
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day, index) => (
            <motion.button
              key={`${day.abbr}-${day.num}`}
              whileTap={{ scale: 0.88 }}
              onClick={() => setActiveDay(index)}
              className={`flex flex-shrink-0 flex-col items-center justify-center rounded-[1.25rem] transition-all duration-300 ${
                index === activeDay
                  ? "h-[3.4rem] w-[2.9rem] bg-[#5B1112] text-white shadow-md shadow-[#5B1112]/25"
                  : "h-[3rem] w-[2.5rem] bg-white/55 text-[#111214]/40 hover:bg-white/75"
              }`}
            >
              <span className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider">{day.abbr}</span>
              <span className={`font-serif ${index === activeDay ? "text-lg" : "text-sm"}`}>{day.num}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <SkinScoreRing score={78} size={70} />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[#5B1112]" style={{ fontSize: 28, lineHeight: 1 }}>
                78
              </span>
              <span className="flex items-center gap-0.5 text-emerald-500">
                <TrendingUp size={10} />
                <span className="text-[10px] font-semibold">+3 vs hier</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#111214]/40">Excellent etat</p>
            <p className="mt-1 text-[10px] text-[#111214]/30">Tendance stable sur 7j</p>
          </div>

          <div className="flex-shrink-0 opacity-75">
            <MelaniaMascot size={54} delay={delay + 0.3} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5">
          <p className="text-[10px] italic leading-snug text-[#111214]/55">
            "Hydratation optimale aujourd'hui - continue avec ton serum !"
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map(({ Icon, label, warn }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium ${
                warn
                  ? "border border-amber-100 bg-amber-50 text-amber-600"
                  : "border border-white/70 bg-white/55 text-[#111214]/50"
              }`}
            >
              <Icon size={10} className={warn ? "text-amber-500" : "text-[#5B1112]/40"} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function RoutineItem({
  title,
  subtitle,
  checked,
  onToggle,
  trailing,
  isMed = false,
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
  isMed?: boolean;
}) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`flex cursor-pointer select-none items-center gap-3.5 rounded-[1.5rem] px-4 py-3.5 transition-colors duration-200 ${
        checked
          ? "bg-white/30"
          : "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          checked ? "bg-[#5B1112]" : "border-2 border-[#111214]/10"
        }`}
      >
        <Check
          size={12}
          strokeWidth={3}
          className={`text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm font-medium transition-all ${
              checked ? "text-[#111214]/30 line-through" : "text-[#111214]"
            }`}
          >
            {title}
          </p>
          {isMed ? (
            <span className="flex-shrink-0 rounded-full bg-[#5B1112]/8 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#5B1112]/55">
              Medicament
            </span>
          ) : null}
        </div>

        {subtitle ? <p className="mt-0.5 truncate text-[10px] text-[#111214]/35">{subtitle}</p> : null}
      </div>

      {trailing ? <div className="flex-shrink-0">{trailing}</div> : null}
    </motion.div>
  );
}

type RoutineTab = "matin" | "soir";

interface RoutineEntry {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  isMed?: boolean;
  initDone: boolean;
}

const ROUTINE_DATA: Record<RoutineTab, RoutineEntry[]> = {
  matin: [
    {
      title: "Nettoyage doux",
      subtitle: "Gel nettoyant · Tonique equilibrant",
      trailing: <Sparkles size={13} className="text-[#5B1112]" />,
      isMed: false,
      initDone: true,
    },
    {
      title: "Hydratation + SPF 50",
      subtitle: "UV 8/12 · Harmattan actif · 32 C",
      trailing: (
        <div className="flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-2 py-1">
          <CloudSun size={11} className="text-amber-500" />
          <span className="text-[9px] font-semibold text-amber-500">32 C</span>
        </div>
      ),
      isMed: false,
      initDone: false,
    },
    {
      title: "Doxycycline 100 mg",
      subtitle: "Avec repas du matin",
      trailing: (
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#111214]/5">
          <Pill size={12} className="text-[#111214]/30" />
        </div>
      ),
      isMed: true,
      initDone: false,
    },
  ],
  soir: [
    {
      title: "Demaquillage complet",
      subtitle: "Huile · Eau micellaire",
      trailing: null,
      isMed: false,
      initDone: false,
    },
    {
      title: "Serum Retinol 0.25%",
      subtitle: "Appliquer sur peau propre et seche",
      trailing: (
        <div className="rounded-lg bg-[#5B1112]/6 px-2 py-1">
          <span className="text-[9px] font-semibold text-[#5B1112]">0.25%</span>
        </div>
      ),
      isMed: false,
      initDone: false,
    },
    {
      title: "Creme nuit nourrissante",
      subtitle: "Karite · Niacinamide",
      trailing: <Star size={12} className="fill-[#5B1112] text-[#FEF0D5]" />,
      isMed: false,
      initDone: false,
    },
  ],
};

function RoutineCard({ delay = 0 }: { delay?: number }) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const actingProfileId = auth.actingProfileId;
  const [tab, setTab] = useState<RoutineTab>("matin");
  const [checked, setChecked] = useState<Record<RoutineTab, boolean[]>>({
    matin: ROUTINE_DATA.matin.map((item) => item.initDone),
    soir: ROUTINE_DATA.soir.map((item) => item.initDone),
  });
  const [timelineEvents, setTimelineEvents] = useState<PatientRecordEvent[]>([]);
  const [screeningReminders, setScreeningReminders] = useState<ScreeningReminder[]>([]);
  const [screeningChannels, setScreeningChannels] = useState<NotificationChannelPreference | null>(
    null,
  );
  const [isHubLoading, setIsHubLoading] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingReminderId, setSavingReminderId] = useState<string | null>(null);
  const [isSavingChannels, setIsSavingChannels] = useState(false);

  const toggle = (currentTab: RoutineTab, index: number) => {
    setChecked((prev) => ({
      ...prev,
      [currentTab]: prev[currentTab].map((value, mapIndex) => (mapIndex === index ? !value : value)),
    }));
  };

  const totalDone = checked.matin.filter(Boolean).length + checked.soir.filter(Boolean).length;
  const totalItems = ROUTINE_DATA.matin.length + ROUTINE_DATA.soir.length;
  const progress = (totalDone / totalItems) * 100;

  useEffect(() => {
    if (!userId || !actingProfileId) {
      setTimelineEvents([]);
      setScreeningReminders([]);
      setScreeningChannels(null);
      setHubError(null);
      return;
    }

    let cancelled = false;
    setIsHubLoading(true);
    setHubError(null);

    void Promise.all([
      auth.accountAdapter.listTimelineEvents(userId, actingProfileId, 20),
      auth.accountAdapter.listScreeningReminders(userId, actingProfileId),
      auth.accountAdapter.getNotificationPreferences(userId, actingProfileId),
    ])
      .then(([events, reminders, preferences]) => {
        if (cancelled) return;
        setTimelineEvents(events);
        setScreeningReminders(reminders);
        setScreeningChannels(preferences.screening);
      })
      .catch(() => {
        if (cancelled) return;
        setHubError("Impossible de charger le dossier patient pour le moment.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsHubLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actingProfileId, auth.accountAdapter, userId]);

  const updateReminder = async (
    reminderId: string,
    patch: Partial<Pick<ScreeningReminder, "cadence" | "status" | "nextDueAt" | "channels">>,
  ) => {
    if (!userId || !actingProfileId) return;
    setSavingReminderId(reminderId);
    setHubError(null);
    try {
      const updated = await auth.accountAdapter.updateScreeningReminder({
        actorUserId: userId,
        profileId: actingProfileId,
        reminderId,
        patch,
      });
      setScreeningReminders((prev) =>
        prev.map((reminder) => (reminder.id === reminderId ? updated : reminder)),
      );
    } catch {
      setHubError("La mise à jour du rappel a échoué. Réessayez.");
    } finally {
      setSavingReminderId(null);
    }
  };

  const toggleScreeningChannel = async (channel: keyof NotificationChannelPreference) => {
    if (!userId || !actingProfileId || !screeningChannels) return;
    const nextChannels = {
      ...screeningChannels,
      [channel]: !screeningChannels[channel],
    };
    setScreeningChannels(nextChannels);
    setIsSavingChannels(true);
    setHubError(null);

    try {
      const reminderUpdates = screeningReminders.map((reminder) =>
        auth.accountAdapter.updateScreeningReminder({
          actorUserId: userId,
          profileId: actingProfileId,
          reminderId: reminder.id,
          patch: { channels: nextChannels },
        }),
      );

      const prefsUpdate = auth.accountAdapter.updateNotificationPreferences({
        actorUserId: userId,
        profileId: actingProfileId,
        patch: { screening: nextChannels },
      });

      const updatedReminders = await Promise.all([...reminderUpdates, prefsUpdate]).then(
        (results) => results.slice(0, screeningReminders.length) as ScreeningReminder[],
      );

      setScreeningReminders((prev) =>
        prev.map((reminder, index) => updatedReminders[index] ?? reminder),
      );
    } catch {
      setScreeningChannels((prev) =>
        prev
          ? {
              ...prev,
              [channel]: !nextChannels[channel],
            }
          : prev,
      );
      setHubError("Impossible de mettre à jour les canaux de rappel.");
    } finally {
      setIsSavingChannels(false);
    }
  };

  if (!actingProfileId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2rem] border border-[#5B1112]/15 bg-white/85 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5B1112]/65">
          Dossier & rappels
        </p>
        <h3 className="mt-2 font-serif text-[#111214]" style={{ fontSize: 22 }}>
          Dossier patient verrouillé
        </h3>
        <p className="mt-2 text-sm text-[#111214]/62">
          Choisissez le profil patient actif pour consulter la timeline, les rappels et les
          préférences de dépistage.
        </p>
        <Link
          to="/patient-flow/account/select-profile"
          state={{ returnTo: PATHS.records }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-medium text-white"
        >
          Sélectionner un profil
          <ArrowUpRight size={12} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">Routine du jour</p>
          <span className="text-[10px] font-semibold text-[#5B1112]">
            {totalDone}/{totalItems} complete
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#111214]/6">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#5B1112] to-[#8B1A1B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: delay + 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="flex gap-1 rounded-[1.25rem] bg-[#111214]/5 p-1">
        {(["matin", "soir"] as const).map((itemTab) => (
          <button
            key={itemTab}
            onClick={() => setTab(itemTab)}
            className={`flex-1 rounded-[1rem] py-2 text-xs font-medium capitalize transition-all duration-200 ${
              tab === itemTab
                ? "bg-white text-[#111214] shadow-sm"
                : "text-[#111214]/40 hover:text-[#111214]/60"
            }`}
          >
            {itemTab === "matin" ? "Matin" : "Soir"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-2"
        >
          {ROUTINE_DATA[tab].map((item, index) => (
            <RoutineItem
              key={`${item.title}-${index}`}
              title={item.title}
              subtitle={item.subtitle}
              checked={checked[tab][index]}
              onToggle={() => toggle(tab, index)}
              trailing={item.trailing}
              isMed={item.isMed}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="h-px bg-[#111214]/6" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/30">
              Dossier patient
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">Timeline clinique (événements récents)</p>
          </div>
          {isHubLoading ? (
            <span className="text-[10px] text-[#111214]/45">Chargement...</span>
          ) : null}
        </div>

        {hubError ? (
          <div className="rounded-xl border border-[#5B1112]/20 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
            {hubError}
          </div>
        ) : null}

        {timelineEvents.length === 0 && !isHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun événement de dossier pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {timelineEvents.slice(0, 6).map((event) => {
              const Icon = timelineIcon(event.type);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border border-[#111214]/8 bg-white px-3 py-2.5"
                >
                  <div className="mt-0.5 rounded-lg bg-[#5B1112]/7 p-1.5">
                    <Icon size={12} className="text-[#5B1112]/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111214]/75">{event.title}</p>
                    {event.description ? (
                      <p className="mt-0.5 text-[10px] text-[#111214]/45">{event.description}</p>
                    ) : null}
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      {formatDateTime(event.occurredAt)} · il y a {formatRelativeFromNow(event.occurredAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/30">
              Rappels dépistage
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">Liste des rappels et statut actuel</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className="rounded-full border border-[#111214]/12 bg-white px-3 py-1.5 text-[10px] font-medium text-[#111214]/60"
            aria-expanded={isSettingsOpen}
            aria-controls="pat23-settings"
          >
            {isSettingsOpen ? "Masquer les paramètres" : "Ouvrir les paramètres"}
          </button>
        </div>

        {screeningReminders.length === 0 && !isHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun rappel configuré pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {screeningReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-xl border border-[#111214]/8 bg-white px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111214]/76">{reminder.screeningType}</p>
                    <p className="mt-0.5 text-[10px] text-[#111214]/42">
                      Prochaine échéance: {formatDate(reminder.nextDueAt)}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      Canaux: {channelSummary(reminder.channels)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${reminderStatusTone(
                      reminder.status,
                    )}`}
                  >
                    {STATUS_LABELS[reminder.status]}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="text-[10px] text-[#111214]/45">
                    Cadence
                    <select
                      value={reminder.cadence}
                      onChange={(event) =>
                        void updateReminder(reminder.id, {
                          cadence: event.currentTarget.value as ScreeningCadence,
                        })
                      }
                      disabled={savingReminderId === reminder.id}
                      className="mt-1 w-full rounded-lg border border-[#111214]/12 bg-white px-2 py-1.5 text-[11px] text-[#111214]/75"
                    >
                      {(Object.keys(CADENCE_LABELS) as ScreeningCadence[]).map((cadence) => (
                        <option key={cadence} value={cadence}>
                          {CADENCE_LABELS[cadence]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-[10px] text-[#111214]/45">
                    Statut
                    <select
                      value={reminder.status}
                      onChange={(event) =>
                        void updateReminder(reminder.id, {
                          status: event.currentTarget.value as ScreeningReminderStatus,
                        })
                      }
                      disabled={savingReminderId === reminder.id}
                      className="mt-1 w-full rounded-lg border border-[#111214]/12 bg-white px-2 py-1.5 text-[11px] text-[#111214]/75"
                    >
                      {(Object.keys(STATUS_LABELS) as ScreeningReminderStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence initial={false}>
        {isSettingsOpen ? (
          <motion.section
            id="pat23-settings"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2 rounded-xl border border-[#5B1112]/16 bg-[#5B1112]/4 p-3"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/65">
              Paramètres des rappels
            </p>
            <p className="text-[11px] text-[#111214]/55">
              Choisissez les canaux utilisés pour les rappels de dépistage.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["sms", "SMS"],
                  ["whatsapp", "WhatsApp"],
                  ["email", "Email"],
                ] as Array<[keyof NotificationChannelPreference, string]>
              ).map(([channel, label]) => {
                const enabled = Boolean(screeningChannels?.[channel]);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => void toggleScreeningChannel(channel)}
                    disabled={isSavingChannels || !screeningChannels}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      enabled
                        ? "border-[#5B1112]/30 bg-[#5B1112]/14 text-[#5B1112]"
                        : "border-[#111214]/14 bg-white text-[#111214]/55"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function WeeklyScanCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 rounded-[2rem] border border-[#5B1112]/8 p-5"
      style={{ background: "linear-gradient(135deg, #fff9f0 0%, #FEF0D5 70%, #fde8bf 100%)" }}
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.1rem] bg-[#5B1112] shadow-lg shadow-[#5B1112]/30"
      >
        <ScanFace size={22} className="text-white" />
      </motion.div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/45">Cette semaine</p>
        <p className="font-serif text-[#111214]" style={{ fontSize: 16 }}>
          Scan IA hebdomadaire
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#111214]/35">Derniere : il y a 6 jours</span>
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#111214]/20" />
          <span className="text-[10px] font-medium text-[#5B1112]/55">Prochaine : demain</span>
        </div>
      </div>

      <Link to={PATHS.scan} className="flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.04, x: -2 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-full bg-[#5B1112] px-4 py-2.5 text-xs font-medium text-white shadow-md shadow-[#5B1112]/22"
        >
          Scanner
          <ChevronRight size={12} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

function RightPanel() {
  const shortcuts = [
    { Icon: ScanFace, label: "Scanner", to: PATHS.scan, desc: "Analyse IA cutanee" },
    { Icon: Camera, label: "Ajouter photos", to: PATHS.photos, desc: "Galerie et suivi visuel" },
    { Icon: Plus, label: "Nouveau cas", to: PATHS.cases, desc: "Creer un suivi" },
  ];

  const stats = [
    { Icon: CloudSun, label: "UV Index", value: "8", unit: "/12", warn: true },
    { Icon: Droplets, label: "Hydratat.", value: "72", unit: "%", warn: false },
    { Icon: Wind, label: "Harmattan", value: "Actif", unit: "", warn: false },
    { Icon: Activity, label: "Peau", value: "Bon", unit: "", warn: false },
  ];

  return (
    <div className="sticky top-8 flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-white bg-white/70 p-8 shadow-[0_8px_48px_rgba(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FEF0D5] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#5B1112]/3 blur-2xl" />
        <div className="relative z-10">
          <MelaniaMascot size={140} delay={0.4} />
        </div>

        <div className="relative z-10 w-full">
          <div
            className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#FEF0D5]/80"
            style={{ boxShadow: "-1px -1px 0 rgba(17,18,20,0.04)" }}
          />
          <div className="rounded-[1.25rem] border border-[#111214]/5 bg-[#FEF0D5]/80 px-5 py-4 backdrop-blur-sm">
            <p className="text-center text-xs italic leading-relaxed text-[#111214]/60">
              "Ta peau est bien hydratee aujourd'hui. Continue avec ton serum."
            </p>
          </div>
        </div>

        <p className="z-10 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5B1112]/40">
          Melanis · Votre guide peau
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">Raccourcis</p>
        <div className="flex flex-col gap-2">
          {shortcuts.map(({ Icon, label, to, desc }, index) => (
            <Link key={`${label}-${index}`} to={to}>
              <motion.div
                whileHover={{ x: 3 }}
                className="group flex cursor-pointer items-center gap-3 rounded-[1.25rem] bg-[#111214]/3 px-4 py-3 transition-colors hover:bg-[#5B1112]/5"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon size={14} className="text-[#5B1112]/55" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#111214]/65 transition-colors group-hover:text-[#111214]">
                    {label}
                  </p>
                  <p className="truncate text-[9px] text-[#111214]/30">{desc}</p>
                </div>
                <ChevronRight
                  size={12}
                  className="flex-shrink-0 text-[#111214]/18 transition-colors group-hover:text-[#5B1112]/40"
                />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Meteo Peau · Dakar
        </p>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ Icon, label, value, unit, warn }, index) => (
            <motion.div
              key={`${label}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.07 }}
              className={`flex flex-col items-center gap-1 rounded-[1.25rem] py-3 ${
                warn ? "border border-amber-100/80 bg-amber-50" : "bg-[#111214]/3"
              }`}
            >
              <Icon size={13} className={warn ? "text-amber-500" : "text-[#5B1112]/50"} />
              <div className="flex items-baseline gap-px">
                <span className="font-serif text-sm text-[#111214]">{value}</span>
                <span style={{ fontSize: 8, color: "rgba(17,18,20,0.35)" }}>{unit}</span>
              </div>
              <span
                style={{ fontSize: 7.5, color: "rgba(17,18,20,0.4)" }}
                className="px-1 text-center uppercase leading-tight tracking-wider"
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#111214] p-5 text-white"
      >
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-[#5B1112] opacity-60 blur-2xl transition-transform duration-700 group-hover:scale-150" />
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#FEF0D5]/30" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <Zap size={13} className="text-[#FEF0D5]" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#FEF0D5]/50">Premium</p>
          </div>

          <h4 className="mb-1 font-serif text-[#FEF0D5]" style={{ fontSize: 18 }}>
            Melanis+
          </h4>
          <p className="text-xs leading-relaxed text-white/35">
            Suivi IA illimite, consultations prioritaires et analyses avancees.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#FEF0D5]">
            Decouvrir <ArrowUpRight size={11} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function DashboardHome({ firstName, upcoming }: DashboardHomeProps) {
  const greeting = getGreeting();

  return (
    <div className="min-h-full xl:grid xl:grid-cols-[1fr_300px] xl:items-start xl:gap-10">
      <div className="mx-auto w-full max-w-[48rem] space-y-4 pb-28 lg:pb-12 xl:max-w-none">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pb-1 pt-1"
        >
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-serif text-[#111214]" style={{ fontSize: 32, lineHeight: 1.15 }}>
              {greeting},
            </h1>
            <h1 className="font-serif text-[#5B1112]" style={{ fontSize: 32, lineHeight: 1.15 }}>
              {firstName}
            </h1>
          </div>
        </motion.div>

        <div id="appointments" className="scroll-mt-28">
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppointmentCard delay={0.14} appointment={upcoming} />
          <TodayCard delay={0.2} />
        </div>

        <div id="records" className="scroll-mt-28">
          <RoutineCard delay={0.28} />
        </div>

        <div id="scan" className="scroll-mt-28">
          <WeeklyScanCard delay={0.36} />
        </div>
      </div>

      <div className="hidden xl:block">
        <RightPanel />
      </div>
    </div>
  );
}

export default function AU06() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  const firstName = useMemo(() => getFirstName(auth.user?.fullName), [auth.user?.fullName]);

  const upcoming = useMemo<UpcomingAppointment>(() => {
    const flow = auth.flowContext;
    const isVideo = flow?.appointmentType === "video";

    const practitioner =
      typeof flow?.practitioner?.name === "string" ? flow.practitioner.name : "Dr. Awa Ndiaye";
    const location =
      typeof flow?.practitioner?.location === "string"
        ? flow.practitioner.location
        : isVideo
          ? "Consultation video"
          : "Dermatologue · Dakar";

    const rawDateLabel =
      typeof flow?.selectedSlot?.date === "string"
        ? flow.selectedSlot.date
        : typeof flow?.date === "string"
          ? flow.date
          : "Aujourd'hui";

    const rawTimeLabel =
      typeof flow?.selectedSlot?.time === "string"
        ? flow.selectedSlot.time
        : typeof flow?.time === "string"
          ? flow.time
          : "14h30";

    return {
      practitioner,
      location,
      dateLabel: rawDateLabel,
      timeLabel: formatTimeLabel(rawTimeLabel),
      isVideo,
    };
  }, [auth.flowContext]);

  const handleLogout = () => {
    void auth.logout().finally(() => {
      navigate("/patient-flow/auth", { replace: true });
    });
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout fullName={auth.user?.fullName ?? "Fatou Diop"} onLogout={handleLogout}>
      <DashboardHome firstName={firstName} upcoming={upcoming} />
    </DashboardLayout>
  );
}
