import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import { Spinner } from "./components/spinner";
import { NotFound } from "@/pages/NotFound";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Validation } from "@/pages/Validation";
import { Export } from "@/pages/Export";
import { Results } from "./pages/Results";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/results" element={<Results />} />
            <Route path="/validate" element={<Validation />} />
            <Route path="/export" element={<Export />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
}
