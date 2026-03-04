import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Rideshares from "./pages/Rideshares";
import AuthPage from "./pages/AuthPage";
import UserProfile from "./pages/UserProfile";
import DriverRegister from "./pages/DriverRegister";
import DriverLogin from "./pages/DriverLogin";
import DriverCabinet from "./pages/DriverCabinet";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/NewsPage";
import PassengerCabinet from "./pages/PassengerCabinet";
import PushNotificationBanner from "./components/PushNotificationBanner";
import BecomeDriverPage from "./pages/BecomeDriverPage";
import TariffsPage from "./pages/TariffsPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import { API_URLS } from "./config/api";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const HIDE_PUSH_ROUTES = ['/admin', '/admin/login'];

const UnderDevelopment = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-6">🚧</div>
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      <p className="text-muted-foreground mb-6">Этот раздел находится в разработке. Скоро откроется!</p>
      <Button onClick={() => window.history.back()}>← Назад</Button>
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const hidePush = HIDE_PUSH_ROUTES.some(r => location.pathname.startsWith(r));
  const [features, setFeatures] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(API_URLS.settings)
      .then(r => r.json())
      .then(d => setFeatures(d.settings || {}))
      .catch(() => {});
  }, []);

  const ridesharesEnabled = features['feature_rideshares'] !== 'false';
  const driverRegisterEnabled = features['feature_driver_register'] !== 'false';

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/rideshares" element={ridesharesEnabled ? <Rideshares /> : <UnderDevelopment title="Попутчики" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/driver/register" element={driverRegisterEnabled ? <DriverRegister /> : <UnderDevelopment title="Регистрация водителей" />} />
        <Route path="/become-driver" element={<BecomeDriverPage />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/cabinet" element={<DriverCabinet />} />
        <Route path="/tariffs" element={<TariffsPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/passenger" element={<PassengerCabinet />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hidePush && <PushNotificationBanner />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;