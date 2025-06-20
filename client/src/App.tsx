import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MuiProvider } from "@/providers/MuiProvider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import ReportWizard from "@/pages/report-wizard";
import Landing from "@/pages/landing";
// Original components
import Login from "@/pages/login";
import Home from "@/pages/home";
// TurboTax-style components
import LoginTurboTax from "@/pages/login-turbotax";
import DashboardTurboTax from "@/pages/dashboard-turbotax";
import ReportWizardTurboTax from "@/pages/report-wizard-turbotax";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Use TurboTax-style components by default
  const useTurboTax = true;

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={useTurboTax ? LoginTurboTax : Login} />
        <Route path="/login" component={useTurboTax ? LoginTurboTax : Login} />
        <Route component={useTurboTax ? LoginTurboTax : Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={useTurboTax ? DashboardTurboTax : Home} />
      <Route path="/home" component={useTurboTax ? DashboardTurboTax : Home} />
      <Route path="/dashboard" component={useTurboTax ? DashboardTurboTax : Home} />
      <Route path="/login" component={useTurboTax ? DashboardTurboTax : Home} />
      <Route path="/report-wizard" component={useTurboTax ? ReportWizardTurboTax : ReportWizard} />
      <Route path="/reports/:id" component={useTurboTax ? ReportWizardTurboTax : ReportWizard} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuiProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </MuiProvider>
    </QueryClientProvider>
  );
}

export default App;
