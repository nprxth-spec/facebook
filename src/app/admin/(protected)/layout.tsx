import { AdminShell } from "./AdminShell";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

