import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme_provider";
import { ScrollToTop } from "@/components/scroll_to_top";
import { AppShell } from "@/components/app_shell";
import { LandingPage } from "@/pages/landing_page";
import { CollectionsPage } from "@/pages/collections_page";
import { CollectionPage } from "@/pages/collection_page";
import { FavoritesPageRoute } from "@/pages/favorites_page_route";
import { CreatorPage } from "@/pages/creator_page";
import { TermsPage } from "@/pages/terms_page";
import { PrivacyPolicyPage } from "@/pages/privacy_policy_page";
import { CookiePolicyPage } from "@/pages/cookie_policy_page";
import { LoginPage } from "@/pages/login_page";
import { RegisterPage } from "@/pages/register_page";
import { AccountPage } from "@/pages/account_page";
import { ProfilePage } from "@/pages/profile_page";
import { PasswordPage } from "@/pages/password_page";
import { CreatePage } from "@/pages/create_page";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          {/* DAW editor — standalone fullscreen route (no AppShell) */}
          <Route path="/create" element={<CreatePage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/favorites" element={<FavoritesPageRoute />} />
            <Route path="/creators/:creatorId" element={<CreatorPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/profile" element={<ProfilePage />} />
            <Route path="/account/password" element={<PasswordPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
