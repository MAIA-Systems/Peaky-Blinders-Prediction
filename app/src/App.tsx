import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/Home";
import { MarketDetail } from "@/pages/MarketDetail";
import { Portfolio } from "@/pages/Portfolio";
import { Wallet } from "@/pages/Wallet";
import { CreateMarket } from "@/pages/CreateMarket";
import { Profile } from "@/pages/Profile";
import { Stream } from "@/pages/Stream";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { NotFound } from "@/pages/NotFound";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="market/:id" element={<MarketDetail />} />
              <Route path="create" element={<CreateMarket />} />
              <Route path="stream" element={<Stream />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route
                path="portfolio"
                element={
                  <ProtectedRoute>
                    <Portfolio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="wallet"
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
