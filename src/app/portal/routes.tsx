/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import { Outlet, type RouteObject } from "react-router";
import AuthScreen from "@portal/features/auth/screen";
import SelectProfileScreen from "@portal/features/patient/account/select-profile-screen";
import ConsentsScreen from "@portal/features/patient/account/consents-screen";
import ConsentDetailScreen from "@portal/features/patient/account/consent-detail-screen";
import DependentsScreen from "@portal/features/patient/account/dependents-screen";
import PatientDocumentDetailScreen from "@portal/features/patient/account/document-detail-screen";
import NotificationPreferencesScreen from "@portal/features/patient/account/notification-preferences-screen";
import ProfilesListScreen from "@portal/features/patient/profiles/list-screen";
import ProfileDetailScreen from "@portal/features/patient/profiles/detail-screen";
import CreateChildScreen from "@portal/features/patient/profiles/create-child-screen";
import CreateRelativeScreen from "@portal/features/patient/profiles/create-relative-screen";
import EditProfileScreen from "@portal/features/patient/profiles/edit-screen";
import GuardianScreen from "@portal/features/patient/profiles/guardian-screen";
import {
  RequireActingProfile,
  RequireActiveRole,
  RequireAuth,
  RequireRole,
} from "@portal/session/guards";
import { LoadingState } from "@shared/ui";

const ChooseAppointmentTypeScreen = lazy(
  () => import("@portal/features/patient/booking/choose-appointment-type/screen"),
);
const ChooseSlotScreen = lazy(
  () => import("@portal/features/patient/booking/choose-slot/screen"),
);
const PreconsultScreen = lazy(() => import("@portal/features/patient/preconsult/screen"));
const PreconsultConfirmationScreen = lazy(
  () => import("@portal/features/patient/preconsult/confirmation-screen"),
);
const PreconsultSuccessScreen = lazy(
  () => import("@portal/features/patient/preconsult/success-screen"),
);
const PatientTeledermInboxScreen = lazy(
  () => import("@portal/features/patient/telederm/inbox-screen"),
);
const PatientTeledermComposeScreen = lazy(
  () => import("@portal/features/patient/telederm/compose-screen"),
);
const PatientTeledermCaseDetailScreen = lazy(
  () => import("@portal/features/patient/telederm/case-detail-screen"),
);
const PatientEducationProgramsScreen = lazy(
  () => import("@portal/features/patient/education/programs-screen"),
);
const PatientEducationProgramDetailScreen = lazy(
  () => import("@portal/features/patient/education/program-detail-screen"),
);
const PatientCheckInsScreen = lazy(
  () => import("@portal/features/patient/checkins/screen"),
);
const PatientPreventionScreen = lazy(
  () => import("@portal/features/patient/prevention/screen"),
);
const PatientPreventionAlertDetailScreen = lazy(
  () => import("@portal/features/patient/prevention/alert-detail-screen"),
);
const PatientRemindersScreen = lazy(
  () => import("@portal/features/patient/reminders/screen"),
);
const PatientEventsScreen = lazy(
  () => import("@portal/features/patient/events/screen"),
);
const PatientEventDetailScreen = lazy(
  () => import("@portal/features/patient/events/detail-screen"),
);
const PatientBillingScreen = lazy(
  () => import("@portal/features/patient/billing/screen"),
);
const PatientDashboardScreen = lazy(
  () => import("@portal/features/patient/dashboard/screen"),
);
const ProfileOverviewScreen = lazy(
  () => import("@portal/features/patient/account/overview-screen"),
);
const SelectRoleScreen = lazy(() => import("@portal/features/role-selection/screen"));
const PractitionerDashboardScreen = lazy(
  () => import("@portal/features/practitioner/dashboard-screen"),
);
const PractitionerAppointmentsScreen = lazy(
  () => import("@portal/features/practitioner/appointments-screen"),
);
const PractitionerAppointmentDetailScreen = lazy(
  () => import("@portal/features/practitioner/appointment-detail-screen"),
);
const PractitionerCalendarScreen = lazy(
  () => import("@portal/features/practitioner/calendar-screen"),
);
const PractitionerTeledermInboxScreen = lazy(
  () => import("@portal/features/practitioner/telederm/inbox-screen"),
);
const PractitionerTeledermCaseDetailScreen = lazy(
  () => import("@portal/features/practitioner/telederm/case-detail-screen"),
);
const PractitionerInterPractitionerInboxScreen = lazy(
  () => import("@portal/features/practitioner/inter-practitioner/inbox-screen"),
);
const PractitionerInterPractitionerCaseDetailScreen = lazy(
  () => import("@portal/features/practitioner/inter-practitioner/case-detail-screen"),
);
const StaffHomeScreen = lazy(() => import("@portal/features/staff/home-screen"));
const AdminHomeScreen = lazy(() => import("@portal/features/admin/home-screen"));
const ExternalPractitionerHomeScreen = lazy(
  () => import("@portal/features/external-practitioner/home-screen"),
);

function RootLayout() {
  return <Outlet />;
}

function ProfilesIndexRedirect() {
  return <ProfilesListScreen />;
}

function RequirePatientRoles() {
  return <RequireRole allowedRoles={["patient", "caregiver"]} />;
}

function RequirePractitionerRole() {
  return <RequireRole allowedRoles={["practitioner"]} />;
}

function RequireStaffRole() {
  return <RequireRole allowedRoles={["staff"]} />;
}

function RequireAdminRole() {
  return <RequireRole allowedRoles={["admin"]} />;
}

function RequireExternalPractitionerRole() {
  return <RequireRole allowedRoles={["external_practitioner"]} />;
}

function RouteLoading() {
  return <LoadingState />;
}

function PatientDashboardRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientDashboardScreen />
    </Suspense>
  );
}

function ProfileOverviewRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ProfileOverviewScreen />
    </Suspense>
  );
}

function SelectRoleRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <SelectRoleScreen />
    </Suspense>
  );
}

function ChooseAppointmentTypeRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ChooseAppointmentTypeScreen />
    </Suspense>
  );
}

function ChooseSlotRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ChooseSlotScreen />
    </Suspense>
  );
}

function PreconsultRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultScreen />
    </Suspense>
  );
}

function PreconsultConfirmationRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultConfirmationScreen />
    </Suspense>
  );
}

function PreconsultSuccessRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultSuccessScreen />
    </Suspense>
  );
}

function PatientTeledermInboxRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientTeledermInboxScreen />
    </Suspense>
  );
}

function PatientTeledermComposeRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientTeledermComposeScreen />
    </Suspense>
  );
}

function PatientTeledermCaseDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientTeledermCaseDetailScreen />
    </Suspense>
  );
}

function PatientEducationProgramsRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientEducationProgramsScreen />
    </Suspense>
  );
}

function PatientEducationProgramDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientEducationProgramDetailScreen />
    </Suspense>
  );
}

function PatientCheckInsRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientCheckInsScreen />
    </Suspense>
  );
}

function PatientPreventionRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientPreventionScreen />
    </Suspense>
  );
}

function PatientPreventionAlertDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientPreventionAlertDetailScreen />
    </Suspense>
  );
}

function PatientRemindersRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientRemindersScreen />
    </Suspense>
  );
}

function PatientEventsRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientEventsScreen />
    </Suspense>
  );
}

function PatientEventDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientEventDetailScreen />
    </Suspense>
  );
}

function PatientBillingRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientBillingScreen />
    </Suspense>
  );
}

function PractitionerDashboardRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerDashboardScreen />
    </Suspense>
  );
}

function PractitionerAppointmentsRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerAppointmentsScreen />
    </Suspense>
  );
}

function PractitionerAppointmentDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerAppointmentDetailScreen />
    </Suspense>
  );
}

function PractitionerCalendarRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerCalendarScreen />
    </Suspense>
  );
}

function PractitionerTeledermInboxRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerTeledermInboxScreen />
    </Suspense>
  );
}

function PractitionerTeledermCaseDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerTeledermCaseDetailScreen />
    </Suspense>
  );
}

function PractitionerInterPractitionerInboxRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerInterPractitionerInboxScreen />
    </Suspense>
  );
}

function PractitionerInterPractitionerCaseDetailRoute() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerInterPractitionerCaseDetailScreen />
    </Suspense>
  );
}

function StaffHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <StaffHomeScreen />
    </Suspense>
  );
}

function AdminHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AdminHomeScreen />
    </Suspense>
  );
}

function ExternalPractitionerHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ExternalPractitionerHomeScreen />
    </Suspense>
  );
}

export const portalRoutes: RouteObject[] = [
  {
    path: "/patient-flow",
    Component: RootLayout,
    children: [
      {
        path: "auth",
        Component: AuthScreen,
      },
      {
        path: "auth/connexion",
        Component: AuthScreen,
      },
      {
        path: "auth/inscription",
        Component: AuthScreen,
      },
      {
        path: "auth/mot-de-passe-oublie",
        Component: AuthScreen,
      },
      {
        path: "auth/verification",
        Component: AuthScreen,
      },
      {
        path: "auth/pin",
        Component: AuthScreen,
      },
      {
        Component: RequireAuth,
        children: [
          {
            path: "auth/select-role",
            Component: SelectRoleRoute,
          },
          {
            Component: RequireActiveRole,
            children: [
              {
                Component: RequirePatientRoles,
                children: [
                  {
                    path: "auth/dashboard",
                    Component: PatientDashboardRoute,
                  },
                  {
                    path: "account",
                    children: [
                      {
                        index: true,
                        Component: ProfileOverviewRoute,
                      },
                      {
                        path: "select-profile",
                        Component: SelectProfileScreen,
                      },
                      {
                        path: "dependents",
                        Component: DependentsScreen,
                      },
                      {
                        path: "consents",
                        Component: ConsentsScreen,
                      },
                      {
                        path: "consents/:consentId",
                        Component: ConsentDetailScreen,
                      },
                      {
                        path: "notifications",
                        Component: NotificationPreferencesScreen,
                      },
                    ],
                  },
                  {
                    path: "profiles",
                    children: [
                      {
                        index: true,
                        Component: ProfilesIndexRedirect,
                      },
                      {
                        path: "create-child",
                        Component: CreateChildScreen,
                      },
                      {
                        path: "create-relative",
                        Component: CreateRelativeScreen,
                      },
                      {
                        path: ":profileId",
                        Component: ProfileDetailScreen,
                      },
                      {
                        path: ":profileId/edit",
                        Component: EditProfileScreen,
                      },
                      {
                        path: ":profileId/guardian",
                        Component: GuardianScreen,
                      },
                    ],
                  },
                  {
                    index: true,
                    Component: ChooseAppointmentTypeRoute,
                  },
                  {
                    Component: RequireActingProfile,
                    children: [
                      {
                        path: "auth/dashboard/documents/:documentId",
                        Component: PatientDocumentDetailScreen,
                      },
                      {
                        path: "creneau",
                        Component: ChooseSlotRoute,
                      },
                      {
                        path: "confirmation",
                        Component: PreconsultRoute,
                      },
                      {
                        path: "detail-confirmation",
                        Component: PreconsultConfirmationRoute,
                      },
                      {
                        path: "confirmation-succes",
                        Component: PreconsultSuccessRoute,
                      },
                      {
                        path: "auth/telederm",
                        Component: PatientTeledermInboxRoute,
                      },
                      {
                        path: "auth/telederm/new",
                        Component: PatientTeledermComposeRoute,
                      },
                      {
                        path: "auth/telederm/cases/:caseId",
                        Component: PatientTeledermCaseDetailRoute,
                      },
                      {
                        path: "auth/programs",
                        Component: PatientEducationProgramsRoute,
                      },
                      {
                        path: "auth/programs/:programId",
                        Component: PatientEducationProgramDetailRoute,
                      },
                      {
                        path: "auth/check-ins",
                        Component: PatientCheckInsRoute,
                      },
                      {
                        path: "auth/prevention",
                        Component: PatientPreventionRoute,
                      },
                      {
                        path: "auth/prevention/alerts/:alertId",
                        Component: PatientPreventionAlertDetailRoute,
                      },
                      {
                        path: "auth/reminders",
                        Component: PatientRemindersRoute,
                      },
                      {
                        path: "auth/events",
                        Component: PatientEventsRoute,
                      },
                      {
                        path: "auth/events/:eventId",
                        Component: PatientEventDetailRoute,
                      },
                      {
                        path: "auth/billing",
                        Component: PatientBillingRoute,
                      },
                    ],
                  },
                ],
              },
              {
                Component: RequirePractitionerRole,
                children: [
                  {
                    path: "practitioner",
                    children: [
                      {
                        index: true,
                        Component: PractitionerDashboardRoute,
                      },
                      {
                        path: "appointments",
                        Component: PractitionerAppointmentsRoute,
                      },
                      {
                        path: "appointments/:appointmentId",
                        Component: PractitionerAppointmentDetailRoute,
                      },
                      {
                        path: "calendar",
                        Component: PractitionerCalendarRoute,
                      },
                      {
                        path: "telederm",
                        Component: PractitionerTeledermInboxRoute,
                      },
                      {
                        path: "telederm/:caseId",
                        Component: PractitionerTeledermCaseDetailRoute,
                      },
                      {
                        path: "inter-practitioner",
                        Component: PractitionerInterPractitionerInboxRoute,
                      },
                      {
                        path: "inter-practitioner/:caseId",
                        Component: PractitionerInterPractitionerCaseDetailRoute,
                      },
                    ],
                  },
                ],
              },
              {
                Component: RequireStaffRole,
                children: [
                  {
                    path: "staff",
                    Component: StaffHomeLazy,
                  },
                ],
              },
              {
                Component: RequireAdminRole,
                children: [
                  {
                    path: "admin",
                    Component: AdminHomeLazy,
                  },
                ],
              },
              {
                Component: RequireExternalPractitionerRole,
                children: [
                  {
                    path: "external-practitioner",
                    Component: ExternalPractitionerHomeLazy,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
