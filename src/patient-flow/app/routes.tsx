/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import { Outlet, createBrowserRouter } from "react-router";
import AU01 from "./pages/auth/AU01";
import LandingPage from "../../landing/LandingPage";
import AU05SelectProfile from "./pages/account/AU05SelectProfile";
import AU08ConsentCenter from "./pages/account/AU08ConsentCenter";
import AU09ConsentDetail from "./pages/account/AU09ConsentDetail";
import AU10Dependents from "./pages/account/AU10Dependents";
import AU11NotificationPreferences from "./pages/account/AU11NotificationPreferences";
import PRF01ProfilesList from "./pages/profiles/PRF01ProfilesList";
import PRF02ProfileDetail from "./pages/profiles/PRF02ProfileDetail";
import PRF03CreateChild from "./pages/profiles/PRF03CreateChild";
import PRF04CreateRelative from "./pages/profiles/PRF04CreateRelative";
import PRF05EditProfile from "./pages/profiles/PRF05EditProfile";
import PRF06Guardian from "./pages/profiles/PRF06Guardian";
import {
  RequireActingProfile,
  RequireActiveRole,
  RequireAuth,
  RequireConsent,
  RequireRole,
} from "./routes/guards";

const PF01 = lazy(() => import("./pages/PF01"));
const PF02 = lazy(() => import("./pages/PF02"));
const PF03 = lazy(() => import("./pages/PF03"));
const PF04 = lazy(() => import("./pages/PF04"));
const PF05 = lazy(() => import("./pages/PF05"));
const AU06 = lazy(() => import("./pages/auth/AU06"));
const AU07ProfileOverview = lazy(() => import("./pages/account/AU07ProfileOverview"));
const AU12SelectRole = lazy(() => import("./pages/auth/AU12SelectRole"));
const PRAC01Dashboard = lazy(() => import("./pages/practitioner/PRAC01Dashboard"));
const PRAC02Appointments = lazy(() => import("./pages/practitioner/PRAC02Appointments"));
const PRAC03AppointmentDetail = lazy(() => import("./pages/practitioner/PRAC03AppointmentDetail"));
const StaffHome = lazy(() => import("./pages/roles/StaffHome"));
const AdminHome = lazy(() => import("./pages/roles/AdminHome"));
const ExternalPractitionerHome = lazy(() => import("./pages/roles/ExternalPractitionerHome"));

function RootLayout() {
  return <Outlet />;
}

function ProfilesIndexRedirect() {
  return <PRF01ProfilesList />;
}

function RequireMedicalRecordConsent() {
  return <RequireConsent consentType="medical_record" />;
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
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FEF0D5] px-6">
      <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-white px-4 py-3 text-sm text-[rgba(17,18,20,0.68)]">
        Chargement...
      </div>
    </div>
  );
}

function AU06Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AU06 />
    </Suspense>
  );
}

function AU07ProfileOverviewLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AU07ProfileOverview />
    </Suspense>
  );
}

function AU12SelectRoleLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AU12SelectRole />
    </Suspense>
  );
}

function PF01Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PF01 />
    </Suspense>
  );
}

function PF02Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PF02 />
    </Suspense>
  );
}

function PF03Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PF03 />
    </Suspense>
  );
}

function PF04Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PF04 />
    </Suspense>
  );
}

function PF05Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PF05 />
    </Suspense>
  );
}

function PRAC01Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PRAC01Dashboard />
    </Suspense>
  );
}

function PRAC02Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PRAC02Appointments />
    </Suspense>
  );
}

function PRAC03Lazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <PRAC03AppointmentDetail />
    </Suspense>
  );
}

function StaffHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <StaffHome />
    </Suspense>
  );
}

function AdminHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AdminHome />
    </Suspense>
  );
}

function ExternalPractitionerHomeLazy() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <ExternalPractitionerHome />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/landing",
    Component: LandingPage,
  },
  {
    path: "/patient-flow",
    Component: RootLayout,
    children: [
      {
        path: "auth",
        Component: AU01,
      },
      {
        path: "auth/connexion",
        Component: AU01,
      },
      {
        path: "auth/inscription",
        Component: AU01,
      },
      {
        path: "auth/mot-de-passe-oublie",
        Component: AU01,
      },
      {
        path: "auth/verification",
        Component: AU01,
      },
      {
        path: "auth/pin",
        Component: AU01,
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
                        Component: AU05SelectProfile,
                      },
                      {
                        path: "dependents",
                        Component: AU10Dependents,
                      },
                      {
                        path: "consents",
                        Component: AU08ConsentCenter,
                      },
                      {
                        path: "consents/:consentId",
                        Component: AU09ConsentDetail,
                      },
                      {
                        path: "notifications",
                        Component: AU11NotificationPreferences,
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
                        Component: PRF03CreateChild,
                      },
                      {
                        path: "create-relative",
                        Component: PRF04CreateRelative,
                      },
                      {
                        path: ":profileId",
                        Component: PRF02ProfileDetail,
                      },
                      {
                        path: ":profileId/edit",
                        Component: PRF05EditProfile,
                      },
                      {
                        path: ":profileId/guardian",
                        Component: PRF06Guardian,
                      },
                    ],
                  },
                  {
                    Component: RequireActingProfile,
                    children: [
                      {
                        Component: RequireMedicalRecordConsent,
                        children: [
                          {
                            index: true,
                            Component: PF01Lazy,
                          },
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
]);
