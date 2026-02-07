import { Header } from "@/components/layout/Header";
import { DashboardToggle } from "@/components/layout/DashboardToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <DashboardToggle />
    </div>
  );
}
