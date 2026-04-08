import { useEffect, useMemo, useState } from "react";
import type { AppNotificationRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { Bell, CheckCheck, ChevronRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router";

interface NotificationCenterProps {
  buttonClassName?: string;
  panelClassName?: string;
  iconSize?: number;
}

function resolveNotificationHref(
  notification: AppNotificationRecord,
  activeRole: string | null,
) {
  if (notification.entityType === "async_case") {
    return activeRole === "practitioner"
      ? `/patient-flow/practitioner/telederm/${notification.entityId}`
      : `/patient-flow/auth/telederm/cases/${notification.entityId}`;
  }
  return "/patient-flow/auth/dashboard";
}

export function NotificationCenter({
  buttonClassName = "",
  panelClassName = "",
  iconSize = 18,
}: NotificationCenterProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationRecord[]>([]);

  useEffect(() => {
    if (!auth.user) return;
    let isMounted = true;
    setIsLoading(true);
    auth.accountAdapter
      .listNotifications(auth.user.id, 20)
      .then((items) => {
        if (isMounted) setNotifications(items);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [auth.accountAdapter, auth.user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  async function handleRead(notification: AppNotificationRecord) {
    if (!auth.user || notification.readAt) return;
    const updated = await auth.accountAdapter.markNotificationRead(
      auth.user.id,
      notification.id,
    );
    setNotifications((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleReadAll() {
    if (!auth.user) return;
    await auth.accountAdapter.markAllNotificationsRead(auth.user.id);
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={buttonClassName}
        aria-label="Ouvrir les notifications"
      >
        <Bell size={iconSize} />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#5B1112]" />
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 top-[calc(100%+10px)] z-50 w-[22rem] overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(17,18,20,0.14)] backdrop-blur-xl ${panelClassName}`}
        >
          <div className="flex items-center justify-between border-b border-[#111214]/6 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Notifications
              </p>
              <p className="mt-1 text-sm text-[#111214]/58">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleReadAll()}
              className="inline-flex items-center gap-1 rounded-full border border-[#111214]/8 px-3 py-1.5 text-[11px] font-medium text-[#111214]/56 transition hover:border-[#5B1112]/20 hover:text-[#5B1112]"
            >
              <CheckCheck size={12} />
              Tout lire
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-[#111214]/40">
                <LoaderCircle className="animate-spin" size={18} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-[#111214]/58">
                  Aucune notification pour le moment.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={resolveNotificationHref(notification, auth.activeRole)}
                  onClick={() => {
                    void handleRead(notification);
                    setIsOpen(false);
                  }}
                  className={`mb-2 flex items-start gap-3 rounded-[1.2rem] border px-3.5 py-3 transition hover:border-[#5B1112]/18 hover:bg-[#FEF0D5]/50 ${
                    notification.readAt
                      ? "border-transparent bg-[#111214]/[0.025]"
                      : "border-[#5B1112]/10 bg-[#5B1112]/[0.04]"
                  }`}
                >
                  <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#5B1112]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111214]">
                      {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#111214]/58">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#111214]/28">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(notification.createdAt))}
                    </p>
                  </div>
                  <ChevronRight size={14} className="mt-1 text-[#111214]/25" />
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
