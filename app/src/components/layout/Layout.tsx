import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";

export function Layout() {
  return (
    <div className="grain relative flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <VerifyEmailBanner />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
