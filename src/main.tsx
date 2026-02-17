import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppDependenciesProvider } from "./app/contexts/AppDependenciesProvider";
import { router } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppDependenciesProvider>
      <RouterProvider router={router} />
    </AppDependenciesProvider>
  </StrictMode>,
);
