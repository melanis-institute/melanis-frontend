import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import {
  Bell,
  Calendar,
  CalendarDays,
  Home,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

const PRAC_PATHS = {
  home: "/patient-flow/practitioner",
  appointments: "/patient-flow/practitioner#appointments",
  calendar: "/patient-flow/practitioner/calendar",
} as const;

const DEFAULT_PROFILE_AVATAR = "/default-avatar-profile.svg";

interface PractitionerDashboardLayoutProps {
  fullName: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

function isPathActive(pathname: string, hash: string, target: string, exact: boolean): boolean {
  const hashIndex = target.indexOf("#");
  const targetPath = hashIndex >= 0 ? target.slice(0, hashIndex) : target;
  const targetHash = hashIndex >= 0 ? target.slice(hashIndex) : "";

  const pathMatch = exact
    ? pathname === targetPath
    : pathname === targetPath || pathname.startsWith(`${targetPath}/`);

  if (!pathMatch) return false;
  if (targetHash) return hash === targetHash;
  if (exact) return hash === "" || hash === "#";
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
            layoutId="prac-sidebar-pip"
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
    <Link
      to={path}
      className="flex h-full flex-1 flex-col items-center justify-end pb-2 pt-1"
    >
      <motion.div
        whileTap={{ scale: 0.85 }}
        className={`relative rounded-2xl p-2.5 transition-all duration-300 ${
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

export function PractitionerDashboardLayout({
  fullName,
  onLogout,
  children,
}: PractitionerDashboardLayoutProps) {
  const location = useLocation();

  const isPath = (target: string, exact: boolean) =>
    isPathActive(location.pathname, location.hash, target, exact);

  const menuItems = [
    { icon: Home, label: "Accueil", path: PRAC_PATHS.home, exact: true },
    {
      icon: Calendar,
      label: "Rendez-vous",
      path: PRAC_PATHS.appointments,
      exact: false,
    },
    {
      icon: CalendarDays,
      label: "Agenda",
      path: PRAC_PATHS.calendar,
      exact: false,
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#FEF0D5] font-sans">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute left-[-4%] top-[-8%] h-[38vw] w-[38vw] rounded-full bg-white/50 opacity-60 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[-4%] h-[42vw] w-[42vw] rounded-full bg-[#5B1112]/4 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FEF0D5]/20 blur-[80px]" />
      </div>

      {/* ── Sidebar (desktop) ── */}
      <aside className="sticky top-0 z-40 hidden h-screen w-[17rem] flex-shrink-0 p-5 lg:flex lg:flex-col">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/55 px-6 pb-6 pt-8 shadow-[0_8px_48px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/30 to-transparent" />

          {/* Logo */}
          <div className="relative z-10 mb-8 flex items-center gap-3 px-1">
            <MelaniaMascot size={38} animated delay={0.1} />
            <div>
              <span
                className="font-serif text-[#111214]"
                style={{ fontSize: 20, letterSpacing: "-0.02em" }}
              >
                melanis
              </span>
              <div className="-mt-0.5 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] uppercase tracking-wider text-[#111214]/30">
                  En ligne
                </span>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="relative z-10 mb-5 rounded-xl bg-[#5B1112]/[0.07] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5B1112]/70">
              Espace praticien
            </span>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex-1 space-y-0.5">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={isPath(item.path, item.exact)}
              />
            ))}
          </nav>

          {/* User card */}
          <div className="relative z-10 border-t border-[#111214]/5 pt-4">
            <div className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white/50">
              <div className="relative flex-shrink-0">
                <img
                  src={DEFAULT_PROFILE_AVATAR}
                  alt="Profil"
                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
                />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111214]">{fullName}</p>
                <p className="truncate text-[10px] text-[#111214]/40">Dermatologue · Melanis</p>
              </div>
              <button
                type="button"
                onClick={() => void onLogout()}
                aria-label="Se déconnecter"
                className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/70"
              >
                <LogOut
                  size={15}
                  className="text-[#111214]/25 group-hover:text-[#5B1112]"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/30 bg-[#FEF0D5]/85 px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2.5">
            <MelaniaMascot size={34} animated={false} />
            <span
              className="font-serif text-[#111214]"
              style={{ fontSize: 18, letterSpacing: "-0.02em" }}
            >
              melanis
            </span>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/60 bg-white/60 p-2 text-[#111214]/60 shadow-sm transition-colors hover:bg-white"
          >
            <Bell size={18} />
          </button>
        </header>

        {/* Desktop header */}
        <header className="hidden items-center justify-between px-10 py-6 lg:flex">
          <div>
            <h2 className="font-serif text-[#111214]" style={{ fontSize: 22 }}>
              Tableau de bord
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex w-72 items-center rounded-full border border-white/70 bg-white/60 px-4 py-2.5 shadow-sm transition-all backdrop-blur-md focus-within:bg-white focus-within:shadow-md">
              <Search size={16} className="mr-2.5 flex-shrink-0 text-[#111214]/35" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                className="w-full border-none bg-transparent text-sm text-[#111214] outline-none placeholder:text-[#111214]/35"
              />
            </div>
            <button
              type="button"
              className="group rounded-full border border-white/70 bg-white/70 p-2.5 text-[#111214]/50 shadow-sm transition-all hover:bg-[#5B1112] hover:text-white"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="mx-3 mb-3 rounded-[2rem] border border-white/60 bg-[#FEF0D5]/90 shadow-[0_-4px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
            <div className="flex h-[4.5rem] items-end justify-around px-2">
              {menuItems.map((item) => (
                <BottomNavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={isPath(item.path, item.exact)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
