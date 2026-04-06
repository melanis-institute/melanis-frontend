import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import {
  Bell,
  Calendar,
  FileText,
  Home,
  LogOut,
  ScanFace,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

const PATHS = {
  home: "/patient-flow/auth/dashboard",
  appointments: "/patient-flow/auth/dashboard#appointments",
  records: "/patient-flow/auth/dashboard#records",
  profile: "/patient-flow/account",
  scan: "/patient-flow/auth/dashboard#scan",
} as const;

const DEFAULT_PROFILE_AVATAR = "/default-avatar-profile.svg";

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
            isActive
              ? "bg-[#5B1112] shadow-[#5B1112]/40"
              : "bg-[#111214] shadow-[#111214]/20"
          }`}
        >
          <ScanFace size={22} className="text-white" />
        </div>
      </motion.div>

      <span
        className={`-mt-3 flex h-3 items-center text-center text-[9px] font-bold uppercase leading-none tracking-wider transition-colors ${
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

          <nav className="relative z-10 flex-1 space-y-0.5">
            {[
              ...menuItems.slice(0, 2),
              {
                icon: ScanFace,
                label: "Scan IA",
                path: PATHS.scan,
                exact: true,
              },
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
                <p className="truncate text-sm font-semibold text-[#111214]">
                  {fullName}
                </p>
                <p className="truncate text-[10px] text-[#111214]/40">
                  Dakar, Senegal
                </p>
              </div>

              <button
                type="button"
                onClick={() => void onLogout()}
                aria-label="Se deconnecter"
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

      <main className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
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

          <div className="flex items-center gap-2.5">
            <button className="rounded-full border border-white/60 bg-white/60 p-2 text-[#111214]/60 shadow-sm transition-colors hover:bg-white">
              <Bell size={18} />
            </button>
            <Link
              to={PATHS.profile}
              className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md"
            >
              <img
                src={DEFAULT_PROFILE_AVATAR}
                className="h-full w-full object-cover"
                alt="Profil"
              />
            </Link>
          </div>
        </header>

        <header className="hidden items-center justify-between px-10 py-6 lg:flex">
          <div>
            <h2 className="font-serif text-[#111214]" style={{ fontSize: 22 }}>
              Tableau de bord
            </h2>
          </div>

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

            <button className="group rounded-full border border-white/70 bg-white/70 p-2.5 text-[#111214]/50 shadow-sm transition-all hover:bg-[#5B1112] hover:text-white">
              <Bell size={18} />
            </button>

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

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto h-full max-w-7xl">{children}</div>
        </div>

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
