import { Home } from "./pages/Home";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { BuyMeCoffee } from "./pages/BuyMeCoffee";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SoundProvider } from "@/context/SoundContext";
import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="getransfr-theme">
      <SoundProvider storageKey="getransfr-muted">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/support" component={BuyMeCoffee} />
          {/* Fallback for 404 - redirects to Home for now or shows simple Not Found */}
          <Route>
            <div className="flex items-center justify-center h-screen">
              <a href="/" className="text-primary hover:underline">
                Go Home
              </a>
            </div>
          </Route>
        </Switch>
        <Toaster position="top-right" />
      </SoundProvider>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
