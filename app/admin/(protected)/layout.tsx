import type { Metadata } from "next";

import { AdminGuard } from "@/components/features/admin/admin-guard";

export const metadata: Metadata = { title: "管理後台" };

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <AdminGuard>{children}</AdminGuard>
    </div>
  );
}
