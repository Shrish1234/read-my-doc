import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FocusProvider } from "@/context/FocusContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavBar } from "@/components/NavBar";
import Index from "./pages/Index";
import TodayPage from "./pages/Today";
import GoalsPage from "./pages/Goals";
import GoalDetailPage from "./pages/GoalDetail";
import SessionsPage from "./pages/Sessions";
import PatternsPage from "./pages/Patterns";
import WeeklyReviewPage from "./pages/WeeklyReview";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      {children}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <FocusProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/today" element={<AppLayout><TodayPage /></AppLayout>} />
              <Route path="/goals" element={<AppLayout><GoalsPage /></AppLayout>} />
              <Route path="/goals/:id" element={<AppLayout><GoalDetailPage /></AppLayout>} />
              <Route path="/sessions" element={<AppLayout><SessionsPage /></AppLayout>} />
              <Route path="/patterns" element={<AppLayout><PatternsPage /></AppLayout>} />
              <Route path="/review" element={<AppLayout><WeeklyReviewPage /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FocusProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
