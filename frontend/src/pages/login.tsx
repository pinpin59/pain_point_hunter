import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 transition-colors duration-300">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-surface backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl shadow-black/5"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-12 h-12 bg-primary-subtle rounded-2xl flex items-center justify-center border border-primary-light">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-base">
              {t("loginPage.welcomeBack")}
            </h1>
            <p className="text-text-muted text-sm">
              {t("loginPage.loginToContinue")}
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() =>
                login({ email: "user@example.com", password: "stringst" })
              }
            >
              {t("loginPage.continueWithGoogle")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-text-muted">
                  {t("loginPage.orCreateAccount")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder={t("loginPage.emailPlaceholder")}
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface-raised text-text-base placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <Button className="w-full" size="lg">
                <Mail className="w-4 h-4 mr-2" />
                {t("loginPage.continueWithEmail")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
