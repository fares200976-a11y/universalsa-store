import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import Home from "@/pages/home";
import Brands from "@/pages/brands";
import Models from "@/pages/models";
import Admin from "@/pages/admin";
import Voitures from "@/pages/voitures";
import Page from "@/pages/page";

const queryClient = new QueryClient();

function getVisitorId(): string {
  let id = sessionStorage.getItem("visitor_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("visitor_id", id);
  }
  return id;
}

function VisitorPing() {
  const idRef = useRef(getVisitorId());

  useEffect(() => {
    const ping = () => {
      fetch("/api/visitors/ping", {
        method: "POST",
        headers: { "x-visitor-id": idRef.current },
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 30_000);
    return () => clearInterval(t);
  }, []);

  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route>
        <VisitorPing />
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <BackgroundMusic />
          <Navbar />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/voitures" component={Voitures} />
              <Route path="/p/:slug" component={Page} />
              <Route path="/7d">
                <Brands type="7d" />
              </Route>
              <Route path="/5d">
                <Brands type="5d" />
              </Route>
              <Route path="/arriere">
                <Brands type="arriere" />
              </Route>
              <Route path="/7d/:brand">
                <Models type="7d" />
              </Route>
              <Route path="/5d/:brand">
                <Models type="5d" />
              </Route>
              <Route path="/arriere/:brand">
                <Models type="arriere" />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
