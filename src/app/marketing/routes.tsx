import type { RouteObject } from "react-router";
import LandingPage from "@marketing/LandingPage";

export const marketingRoutes: RouteObject[] = [
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/landing",
    Component: LandingPage,
  },
];
