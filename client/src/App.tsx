import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/context/UserContext";
import { AprilFoolsProvider, useAprilFools } from "@/context/AprilFoolsContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import MySessions from "@/pages/MySessions";
import SessionDetail from "@/pages/SessionDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sessies/:slug" component={SessionDetail} />
      <Route path="/mijn-sessies" component={MySessions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAprilFools } = useAprilFools();

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
            <AppContent />
            <Toaster />
          </AprilFoolsProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
