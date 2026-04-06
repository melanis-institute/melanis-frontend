import { createBrowserRouter } from "react-router";
import { marketingRoutes } from "@marketing/routes";
import { portalRoutes } from "@portal/routes";

export const router = createBrowserRouter([
  ...marketingRoutes,
  ...portalRoutes,
]);
