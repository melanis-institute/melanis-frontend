/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import { Outlet, type RouteObject } from "react-router";
import AuthScreen from "@portal/features/auth/screen";
import SelectProfileScreen from "@portal/features/patient/account/select-profile-screen";
import ConsentsScreen from "@portal/features/patient/account/consents-screen";
import ConsentDetailScreen from "@portal/features/patient/account/consent-detail-screen";
import DependentsScreen from "@portal/features/patient/account/dependents-screen";
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

function AU06Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PatientDashboardScreen />
    </Suspense>
  );
}

function AU07ProfileOverviewLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ProfileOverviewScreen />
    </Suspense>
  );
}

function AU12SelectRoleLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <SelectRoleScreen />
    </Suspense>
  );
}

function PF01Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ChooseAppointmentTypeScreen />
    </Suspense>
  );
}

function PF02Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ChooseSlotScreen />
    </Suspense>
  );
}

function PF03Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultScreen />
    </Suspense>
  );
}

function PF04Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultConfirmationScreen />
    </Suspense>
  );
}

function PF05Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PreconsultSuccessScreen />
    </Suspense>
  );
}

function PRAC01Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerDashboardScreen />
    </Suspense>
  );
}

function PRAC02Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerAppointmentsScreen />
    </Suspense>
  );
}

function PRAC03Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PractitionerAppointmentDetailScreen />
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
            Component: AU12SelectRoleLazy,
          },
          {
            Component: RequireActiveRole,
            children: [
              {
                Component: RequirePatientRoles,
                children: [
                  {
                    path: "auth/dashboard",
                    Component: AU06Lazy,
                  },
                  {
                    path: "account",
                    children: [
                      {
                        index: true,
                        Component: AU07ProfileOverviewLazy,
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
                    Component: PF01Lazy,
                  },
                  {
                    Component: RequireActingProfile,
                    children: [
                      {
                        path: "creneau",
                        Component: PF02Lazy,
                      },
                      {
                        path: "confirmation",
                        Component: PF03Lazy,
                      },
                      {
                        path: "detail-confirmation",
                        Component: PF04Lazy,
                      },
                      {
                        path: "confirmation-succes",
                        Component: PF05Lazy,
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
                        Component: PRAC01Lazy,
                      },
                      {
                        path: "appointments",
                        Component: PRAC02Lazy,
                      },
                      {
                        path: "appointments/:appointmentId",
                        Component: PRAC03Lazy,
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
