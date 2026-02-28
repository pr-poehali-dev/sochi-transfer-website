import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

const queryClient = new QueryClient();

const HIDE_PUSH_ROUTES = ['/admin', '/admin/login'];

const AppContent = () => {
  const location = useLocation();
  const hidePush = HIDE_PUSH_ROUTES.some(r => location.pathname.startsWith(r));
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/rideshares" element={<Rideshares />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/become-driver" element={<BecomeDriverPage />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/cabinet" element={<DriverCabinet />} />
        <Route path="/tariffs" element={<TariffsPage />} />
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