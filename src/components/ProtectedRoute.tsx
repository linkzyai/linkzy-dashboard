import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link, Shield, AlertCircle } from "lucide-react";
// @ts-expect-error
import { supabase } from "../lib/supabase";
import RegistrationModal from "./RegistrationModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean; // set true if you want to enforce
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerifiedEmail = false,
}) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const loggingOut = sessionStorage.getItem("linkzy_logging_out") === "true";
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Derive email verification from session (fast, no extra fetch)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!loading && isAuthenticated) {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setEmailVerified(!!data.session?.user?.email_confirmed_at);
      } else if (!loading && !isAuthenticated) {
        setEmailVerified(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loading, isAuthenticated]);

  // Preserve your original loading UI
  if (loading) {
    if (loggingOut) {
      navigate("/", { replace: true });
      return null;
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white mb-4">Checking authentication...</p>
          <p className="text-gray-400 text-sm mb-4">
            This should only take a few seconds. Automatic redirect in 10
            seconds.
          </p>
          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2"
          >
            Go to Dashboard Now
          </button>
          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="text-orange-400 hover:text-orange-300 text-sm underline"
            >
              Or refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in → show your existing prompt + modal
  if (!isAuthenticated) {
    if (loggingOut) {
      sessionStorage.removeItem("linkzy_logging_out");
      navigate("/", { replace: true });
      return null;
    }
    return (
      <>
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
              {/* Linkzy Logo */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-2xl font-bold">Linkzy</span>
              </div>
              {/* Access Denied Message */}
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Dashboard Access Required
              </h1>
              <p className="text-gray-300 mb-6">
                You need an account to access the Linkzy dashboard. Create your
                free account to get started with high-quality backlinks.
              </p>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-orange-400 font-medium mb-1">
                      Why sign up?
                    </h4>
                    <ul className="text-orange-300 text-sm space-y-1">
                      <li>• Access premium backlink tools</li>
                      <li>• Track your SEO performance</li>
                      <li>• Get free credits to start</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
        <RegistrationModal
          isOpen={showRegistrationModal}
          setIsModalOpen={setShowRegistrationModal}
        />
      </>
    );
  }

  // (Optional) Enforce email verification
  if (requireVerifiedEmail && emailVerified === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-4">
              Email Verification Required
            </h1>
            <p className="text-gray-300 mb-6">
              Please verify your email and then refresh this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              I’ve verified my email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth OK → render
  return <>{children}</>;
};

export default ProtectedRoute;
