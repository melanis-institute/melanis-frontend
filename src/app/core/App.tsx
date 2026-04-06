import { RouterProvider } from "react-router";
import { AppProviders } from "@app/core/providers/AppProviders";
import { router } from "@app/core/router";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
