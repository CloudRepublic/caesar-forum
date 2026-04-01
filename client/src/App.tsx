import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/context/UserContext";
import { AprilFoolsProvider, useAprilFools } from "@/context/AprilFoolsContext";
import { KonamiCodeProvider } from "@/context/KonamiCodeContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import MySessions from "@/pages/MySessions";
import SessionDetail from "@/pages/SessionDetail";
import DietaryAdmin from "@/pages/DietaryAdmin";
import Archive from "@/pages/Archive";
import EditionDetail from "@/pages/EditionDetail";
import FeedbackForm from "@/pages/FeedbackForm";
import About from "@/pages/About";
import Kiosk from "@/pages/Kiosk";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sessies/:slug" component={SessionDetail} />
      <Route path="/mijn-sessies" component={MySessions} />
      <Route path="/dieetwensen" component={DietaryAdmin} />
      <Route path="/eerdere-edities" component={Archive} />
      <Route path="/edities/:date" component={EditionDetail} />
      <Route path="/edities/:date/feedback/:sessionId" component={FeedbackForm} />
      <Route path="/over" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAprilFools, dismissAprilFools } = useAprilFools();
  const [location] = useLocation();

  if (location === "/kiosk") {
    return <Kiosk />;
  }

  if (isAprilFools) {
    return (
      <>
        <div className="flex min-h-screen flex-col rotate-180 pt-16">
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Navigation isAprilFools />
        <button
          onClick={dismissAprilFools}
          data-testid="button-april-fools-dismiss"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-lg transition-colors hover:bg-accent"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded border-2 border-primary text-primary text-xs">✓</span>
          Je hebt me te pakken!
        </button>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <AprilFoolsProvider>
            <KonamiCodeProvider>
              <AppContent />
              <Toaster />
            </KonamiCodeProvider>
          </AprilFoolsProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
