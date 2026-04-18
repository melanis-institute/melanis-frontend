import { NotificationCenter } from "@portal/shared/components/NotificationCenter";
import {
  BookOpenText,
  Calendar,
  FileText,
  Home,
  LogOut,
  PanelLeftOpen,
  PanelRightOpen,
  Presentation,
  Receipt,
  ScanFace,
  Search,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

const PATHS = {
  home: "/patient-flow/auth/dashboard",
  appointments: "/patient-flow/auth/dashboard#appointments",
  records: "/patient-flow/auth/dashboard#records",
  documents: "/patient-flow/auth/dashboard/documents",
  telederm: "/patient-flow/auth/telederm",
  programs: "/patient-flow/auth/programs",
  prevention: "/patient-flow/auth/prevention",
  reminders: "/patient-flow/auth/reminders",
  events: "/patient-flow/auth/events",
  billing: "/patient-flow/auth/billing",
  profile: "/patient-flow/account",
  scan: "/patient-flow/auth/dashboard#scan",
} as const;

const DEFAULT_PROFILE_AVATAR = "/default-avatar-profile.svg";
const SIDEBAR_PREF_KEY = "melanis_patient_sidebar_collapsed";

interface DashboardLayoutProps {
  fullName: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

function isPathActive(
  locationPathname: string,
  locationHash: string,
  target: string,
  exact = true,
): boolean {
  const [targetPath, targetHash] = target.split("#");
  const targetHashValue = targetHash ? `#${targetHash}` : "";

  const pathMatch = exact
    ? locationPathname === targetPath
    : locationPathname === targetPath ||
      locationPathname.startsWith(`${targetPath}/`);

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
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link to={path} className="block">
      <div
        className={`group relative flex rounded-2xl transition-all duration-200 ${
          collapsed
            ? "flex-col items-center gap-1 px-2 py-3"
            : "items-center gap-3 px-3 py-3"
        } ${
          isActive
            ? "bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/20"
            : "text-[#111214]/45 hover:bg-white/70 hover:text-[#5B1112]"
        }`}
        title={collapsed ? label : undefined}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
        {collapsed ? (
          <span
            className={`text-[8px] font-bold uppercase leading-none tracking-wider ${
              isActive ? "text-white/70" : "text-[#111214]/25"
            }`}
          >
            {label.slice(0, 4)}
          </span>
        ) : (
          <span className="text-[13px] font-medium">{label}</span>
        )}
        {isActive && !collapsed ? (
          <motion.div
            layoutId="patient-sidebar-pip"
            className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/60"
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
    <Link
      to={path}
      className="flex h-full flex-1 flex-col items-center justify-end pb-2 pt-1"
    >
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
      <div className="mt-1 flex h-3 items-center justify-center">
        <AnimatePresence>
          {isActive ? (
            <motion.span
              key={path}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-center text-[9px] font-bold uppercase leading-none tracking-wider text-[#5B1112]"
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </Link>
  );
}

function ScanCenterButton({ isActive }: { isActive: boolean }) {
  return (
    <Link
      to={PATHS.scan}
      className="flex h-full flex-1 flex-col items-center justify-end pb-2 pt-1"
    >
      <motion.div whileTap={{ scale: 0.9 }} className="relative -translate-y-3">
        {isActive ? (
          <motion.div
            className="absolute inset-0 rounded-full bg-[#5B1112]/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ borderRadius: "50%" }}
          />
        ) : null}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#FEF0D5] shadow-lg transition-all duration-300 ${
            isActive
              ? "bg-[#5B1112] shadow-[#5B1112]/35"
              : "bg-[#111214] shadow-[#111214]/15"
          }`}
        >
          <ScanFace size={20} className="text-white" />
        </div>
      </motion.div>
      <span
        className={`-mt-1 flex h-3 items-center text-center text-[9px] font-bold uppercase leading-none tracking-wider transition-colors ${
          isActive ? "text-[#5B1112]" : "text-[#111214]/30"
        }`}
      >
        Scan
      </span>
    </Link>
  );
}

export function DashboardLayout({
  fullName,
  onLogout,
  children,
}: DashboardLayoutProps) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SIDEBAR_PREF_KEY,
      isSidebarCollapsed ? "true" : "false",
    );
  }, [isSidebarCollapsed]);

  const menuItems = [
    { icon: Home, label: "Accueil", path: PATHS.home, exact: true },
    { icon: Calendar, label: "Agenda", path: PATHS.appointments, exact: true },
    {
      icon: Presentation,
      label: "Télé-derm",
      path: PATHS.telederm,
      exact: false,
    },
    {
      icon: BookOpenText,
      label: "Programmes",
      path: PATHS.programs,
      exact: false,
    },
    {
      icon: Shield,
      label: "Prévention",
      path: PATHS.prevention,
      exact: false,
    },
    {
      icon: Calendar,
      label: "Événements",
      path: PATHS.events,
      exact: false,
    },
    {
      icon: Receipt,
      label: "Facturation",
      path: PATHS.billing,
      exact: false,
    },
    { icon: FileText, label: "Dossier", path: PATHS.records, exact: true },
    { icon: User, label: "Profil", path: PATHS.profile, exact: true },
  ];

  const isPath = (target: string, exact = true) =>
    isPathActive(location.pathname, location.hash, target, exact);

  const isRecords =
    isPath(PATHS.records, true) ||
    location.pathname.startsWith(PATHS.documents);
  const isTelederm = isPath(PATHS.telederm, false);
  const isPrograms = isPath(PATHS.programs, false);
  const isPrevention =
    isPath(PATHS.prevention, false) || isPath(PATHS.reminders, false);
  const isEvents = isPath(PATHS.events, false);
  const isBilling = isPath(PATHS.billing, false);
  const isScan = isPath(PATHS.scan, true);

  const pageTitle = location.pathname.startsWith(PATHS.documents)
    ? "Dossier patient"
    : location.pathname.startsWith(PATHS.programs)
      ? "Programmes"
      : location.pathname.startsWith(PATHS.events)
        ? "Événements"
        : location.pathname.startsWith(PATHS.billing)
          ? "Facturation"
          : location.pathname.startsWith(PATHS.prevention) ||
              location.pathname.startsWith(PATHS.reminders)
            ? "Prévention"
            : location.pathname.startsWith(PATHS.telederm)
              ? "Télé-derm"
              : "Tableau de bord";

  const allNavItems = [
    ...menuItems.slice(0, 3),
    { icon: ScanFace, label: "Scan IA", path: PATHS.scan, exact: true },
    ...menuItems.slice(3),
  ];

  const getItemActive = (path: string, exact: boolean) =>
    path === PATHS.records
      ? isRecords
      : path === PATHS.programs
        ? isPrograms
        : path === PATHS.prevention
          ? isPrevention
          : path === PATHS.events
            ? isEvents
            : path === PATHS.billing
              ? isBilling
              : path === PATHS.telederm
                ? isTelederm
                : isPath(path, exact);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#FEF0D5] font-sans">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute left-[-4%] top-[-8%] h-[38vw] w-[38vw] rounded-full bg-white/50 opacity-60 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[-4%] h-[42vw] w-[42vw] rounded-full bg-[#5B1112]/4 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FEF0D5]/20 blur-[80px]" />
      </div>

      {/* ── Sidebar (desktop) ── */}
      <aside
        className={`sticky top-0 z-40 hidden h-screen flex-shrink-0 p-5 transition-[width] duration-300 lg:flex lg:flex-col ${
          isSidebarCollapsed ? "w-[6.75rem]" : "w-[17rem]"
        }`}
      >
        <div
          className={`relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/55 pb-6 pt-8 shadow-[0_8px_48px_rgba(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-300 ${
            isSidebarCollapsed ? "px-3" : "px-4"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/30 to-transparent" />

          {/* Logo */}
          <div className="relative z-10 mb-6 flex-shrink-0">
            {isSidebarCollapsed ? (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#111214]/10 bg-white text-[#111214]/55 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                  title="Agrandir la barre latérale"
                  aria-label="Agrandir la barre latérale"
                >
                  <PanelLeftOpen size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 py-2">
                <span
                  className="flex-1 font-serif text-[#111214]"
                  style={{ fontSize: 23, letterSpacing: "-0.02em" }}
                >
                  melanis
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#111214]/10 bg-white text-[#111214]/40 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                  title="Réduire la barre latérale"
                  aria-label="Réduire la barre latérale"
                >
                  <PanelRightOpen size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Section label */}
          {isSidebarCollapsed ? (
            <div className="relative z-10 mx-2 mb-3 flex-shrink-0 border-t border-[#111214]/[0.06]" />
          ) : (
            <div className="relative z-10 mb-2 flex-shrink-0 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#111214]/30">
                Menu
              </span>
            </div>
          )}

          {/* Navigation */}
          <nav className="relative z-10 min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allNavItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={getItemActive(item.path, item.exact)}
                collapsed={isSidebarCollapsed}
              />
            ))}
          </nav>

          {/* User card */}
          <div className="relative z-10 mt-4 flex-shrink-0">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={DEFAULT_PROFILE_AVATAR}
                    alt="Profil"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-md"
                  />
                  <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  aria-label="Se déconnecter"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#111214]/25 transition-colors hover:bg-white/70 hover:text-[#5B1112]"
                  title="Se déconnecter"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/50 p-3 shadow-sm ring-1 ring-black/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={DEFAULT_PROFILE_AVATAR}
                      alt="Profil"
                      className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                    <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-tight text-[#111214]">
                      {fullName}
                    </p>
                    <p className="truncate text-[11px] text-[#111214]/40">
                      Patient
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    aria-label="Se déconnecter"
                    className="flex-shrink-0 rounded-lg p-1.5 text-[#111214]/25 transition-colors hover:bg-white hover:text-[#5B1112]"
                    title="Se déconnecter"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/30 bg-[#FEF0D5]/85 px-5 py-3 backdrop-blur-xl lg:hidden">
          <span
            className="font-serif text-[#111214]"
            style={{ fontSize: 18, letterSpacing: "-0.02em" }}
          >
            melanis
          </span>
          <div className="flex items-center gap-2.5">
            <NotificationCenter
              buttonClassName="relative rounded-full border border-white/60 bg-white/60 p-2 text-[#111214]/60 shadow-sm transition-colors hover:bg-white"
              panelClassName="right-0"
            />
            <Link
              to={PATHS.profile}
              className="h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-md"
            >
              <img
                src={DEFAULT_PROFILE_AVATAR}
                className="h-full w-full object-cover"
                alt="Profil"
              />
            </Link>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden items-center justify-between px-10 py-6 lg:flex">
          <h2 className="font-serif text-[#111214]" style={{ fontSize: 22 }}>
            {pageTitle}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex w-72 items-center rounded-full border border-white/70 bg-white/60 px-4 py-2.5 shadow-sm transition-all backdrop-blur-md focus-within:bg-white focus-within:shadow-md">
              <Search
                size={16}
                className="mr-2.5 flex-shrink-0 text-[#111214]/35"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full border-none bg-transparent text-sm text-[#111214] outline-none placeholder:text-[#111214]/35"
              />
            </div>
            <NotificationCenter
              buttonClassName="group relative rounded-full border border-white/70 bg-white/70 p-2.5 text-[#111214]/50 shadow-sm transition-all hover:bg-[#5B1112] hover:text-white"
              panelClassName="right-0"
            />
            <Link
              to={PATHS.profile}
              className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-105"
            >
              <img
                src={DEFAULT_PROFILE_AVATAR}
                className="h-full w-full object-cover"
                alt="Profil"
              />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto h-full max-w-7xl">{children}</div>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="mx-3 mb-3 rounded-[2rem] border border-white/60 bg-[#FEF0D5]/90 shadow-[0_-4px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
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
                icon={Presentation}
                label="Télé-derm"
                path={PATHS.telederm}
                isActive={isTelederm}
              />
              <BottomNavItem
                icon={BookOpenText}
                label="Prog."
                path={PATHS.programs}
                isActive={isPrograms}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
