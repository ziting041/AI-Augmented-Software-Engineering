import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/features/admin/admin-login-form";

export const metadata: Metadata = { title: "管理員登入" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <AdminLoginForm />
    </div>
  );
}
