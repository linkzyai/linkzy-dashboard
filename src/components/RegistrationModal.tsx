import React, { useState, useEffect } from "react";
import {
  X,
  Link,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import supabaseService from "../services/supabaseService";

interface RegistrationModalProps {
  isOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  onSwitchToSignIn?: () => void;
}

type TabType = "signup" | "google";

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  setIsModalOpen,
  onSwitchToSignIn,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formFocused, setFormFocused] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [success, setSuccess] = useState("");

  // Set focus to email input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const emailInput = document.getElementById("registration-email");
        if (emailInput) emailInput.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Validate form fields and optionally show errors
  const validateForm = (showErrors = true) => {
    if (activeTab === "signup") {
      // Sign up validation
      if (!email || !password) {
        if (showErrors) {
          setError("Please enter email and password");
        }
        return false;
      }

      if (password.length < 6) {
        if (showErrors) {
          setError("Password must be at least 6 characters");
        }
        return false;
      }
    } else if (activeTab === "google") {
      // Google signup validation - no fields required
      // Website and niche will be collected in dashboard onboarding
    }

    // Clear error if validation passes
    setError("");
    return true;
  };

  // Clear errors when inputs change after validation attempt
  useEffect(() => {
    if (fieldsValidated) {
      validateForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, fieldsValidated, activeTab]);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError("");
    setLoadingMessage("Connecting to Google...");

    try {
      const result = await supabaseService.signInWithGoogle();

      if (result.success) {
        console.log("✅ Google sign-in initiated, redirecting...");
        setSuccess("Redirecting to Google...");
        // OAuth redirect will handle the rest
      } else {
        throw new Error(result.error || "Google sign-in failed");
      }
    } catch (error) {
      let errorMessage = "Failed to connect with Google. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("popup")) {
          errorMessage =
            "Popup was blocked. Please allow popups and try again.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      console.error("❌ Google sign-in failed:", error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleSignup() {
    setIsLoading(true);
    setError("");
    setFieldsValidated(true);

    // Set loading message
    setLoadingMessage("Creating your account...");

    if (!validateForm()) {
      setIsLoading(false);
      setLoadingMessage("");
      return;
    }

    try {
      console.log("🔄 Starting signup process...");

      const result = await supabaseService.registerUser(
        email,
        password,
        "yourdomain.com",
        "technology"
      );

      if (result.success) {
        console.log("✅ Signup successful!");
        setSuccess(
          "Account created! Please check your email to verify your account."
        );

        // Clear form
        setEmail("");
        setPassword("");
        setFieldsValidated(false);

        // Close modal after brief delay
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
        }, 2000);
      } else {
        // Handle specific errors
        console.error("❌ Signup failed:", result.error);

        if (result.error?.includes("User already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else if (result.error?.includes("Password should be")) {
          setError("Password must be at least 6 characters long.");
        } else if (
          result.error?.includes("network") ||
          result.error?.includes("fetch")
        ) {
          setError(
            "Network error. Please check your connection and try again."
          );
        } else {
          setError(result.error || "Signup failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Link className="text-white" size={18} />
            </div>
            <h2 className="text-xl font-bold text-white">Join Linkzy</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === "signup"
                ? "bg-orange-600 text-white"
                : "text-gray-300 hover:text-white"
                }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setActiveTab("google")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === "google"
                ? "bg-orange-600 text-white"
                : "text-gray-300 hover:text-white"
                }`}
            >
              Google
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2">
              <AlertCircle
                className="text-red-400 mt-0.5 flex-shrink-0"
                size={16}
              />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Success Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-2">
              <CheckCircle
                className="text-green-400 mt-0.5 flex-shrink-0"
                size={16}
              />
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          )}

          {/* Loading Message */}
          {loadingMessage && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-blue-300 text-sm">{loadingMessage}</span>
              </div>
            </div>
          )}

          {/* Sign Up Tab */}
          {activeTab === "signup" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="registration-email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${formFocused === "email"
                      ? "text-orange-400"
                      : "text-gray-500"
                      }`}
                    size={18}
                  />
                  <input
                    id="registration-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFormFocused("email")}
                    onBlur={() => setFormFocused(null)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="registration-password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${formFocused === "password"
                      ? "text-orange-400"
                      : "text-gray-500"
                      }`}
                    size={18}
                  />
                  <input
                    id="registration-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFormFocused("password")}
                    onBlur={() => setFormFocused(null)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          )}

          {/* Google Tab */}
          {activeTab === "google" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Continue with Google
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Quick and secure signup with your Google account
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => {
                  if (onSwitchToSignIn) {
                    onSwitchToSignIn();
                  } else {
                    setIsModalOpen(false);
                  }
                }}
                className="text-orange-400 hover:text-orange-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              What you'll get:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-gray-400 text-sm">
                  3 free AI-powered backlink suggestions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-gray-400 text-sm">
                  Personalized outreach templates
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={16} />
                <span className="text-gray-400 text-sm">
                  Real-time link building analytics
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
