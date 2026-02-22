/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Outlet } from "react-router";
import PF01 from "./pages/PF01";
import PF02 from "./pages/PF02";
import PF03 from "./pages/PF03";
import PF04 from "./pages/PF04";
import PF05 from "./pages/PF05";
import AU01 from "./pages/auth/AU01";
import AU02 from "./pages/auth/AU02";
import AU03 from "./pages/auth/AU03";
import AU04 from "./pages/auth/AU04";
import AU05 from "./pages/auth/AU05";
import AU06 from "./pages/auth/AU06";
import AUPin from "./pages/auth/AUPin";
import AUVerification from "./pages/auth/AUVerification";
import LandingPage from "../../landing/LandingPage";

function RootLayout() {
  return <Outlet />;
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
      { index: true, Component: PF01 },
      { path: "creneau", Component: PF02 },
      { path: "confirmation", Component: PF03 },
      { path: "detail-confirmation", Component: PF04 },
      // Auth flow
      { path: "auth", Component: AU01 },
      { path: "auth/connexion", Component: AU02 },
      { path: "auth/inscription", Component: AU03 },
      { path: "auth/mot-de-passe-oublie", Component: AU04 },
      { path: "auth/verification", Component: AUVerification },
      { path: "auth/pin", Component: AUPin },
      { path: "auth/profil", Component: AU05 },
      { path: "auth/dashboard", Component: AU06 },
      // Post-confirmation
      { path: "confirmation-succes", Component: PF05 },
    ],
  },
]);
