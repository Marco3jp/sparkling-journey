import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./app/layout/Layout";
import { HomePage } from "./app/pages/HomePage";
import { WorkDetailPage } from "./app/pages/WorkDetailPage";
import { TagDetailPage } from "./app/pages/TagDetailPage";
import { SearchPage } from "./app/pages/SearchPage";
import { SettingsPage } from "./app/pages/SettingsPage";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="works/:uuid" element={<WorkDetailPage />} />
      <Route path="tags/:uuid" element={<TagDetailPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>,
  ),
);
