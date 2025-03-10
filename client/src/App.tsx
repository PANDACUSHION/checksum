import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NavBar from "@/components/nav-bar";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ForumPage from "@/pages/forum";
import ResourcesPage from "@/pages/resources";
import AdminDashboard from "@/pages/admin/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={HomePage} />
          <ProtectedRoute path="/forum" component={ForumPage} />
          <ProtectedRoute path="/resources" component={ResourcesPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;