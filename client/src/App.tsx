import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CheckIn from "./pages/CheckIn";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/check-in"}>
        {() => (
          <ProtectedRoute>
            <CheckIn />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/dashboard"}>
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/admin"}>
        {() => (
          <ProtectedRoute requiredRoles={["doctor", "triager", "admin"]}>
            <Admin />
          </ProtectedRoute>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
