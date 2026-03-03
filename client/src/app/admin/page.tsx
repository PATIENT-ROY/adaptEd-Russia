"use client";

import dynamic from "next/dynamic";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const AdminContent = dynamic(
  () => import("./admin-content").then((m) => m.AdminContent),
  {
    ssr: false,
    loading: () => (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
        </div>
      </Layout>
    ),
  }
);

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
