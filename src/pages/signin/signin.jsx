import { useState, useEffect, useContext } from "react";
import { CiMail, CiLock } from "react-icons/ci";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { IoIosCheckboxOutline } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextDefinition.js";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        
        
        if (result.requiresTwoFA) {
          navigate('/2fa');
        } else {
          try {
            // Check for pending exam link
            const pendingExamLink = localStorage.getItem('pendingExamLink');
            if (pendingExamLink) {
              localStorage.removeItem('pendingExamLink');
              navigate(`/exam/link/${pendingExamLink}`);
              return;
            }
            
            if (redirectPath) {
              navigate(redirectPath);
            } else {
              const userData = JSON.parse(localStorage.getItem('userData') || '{}');
              const defaultPath = userData?.role === 'instructor' ? '/instructor' : '/student';
              navigate(defaultPath);
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
            setError('Login successful but navigation failed. Please try again.');
          }
        }
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        setError("Cannot connect to server. Please check your internet connection.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-white">
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img
            src="/Logo icon.png"
            alt="Company Logo"
            className="w-16 sm:w-20 md:w-24 h-auto cursor-pointer"
          />
        </button>
      </div>

      <div className="text-center mb-6 mt-20 sm:mt-24 w-full max-w-sm">
        <h1 className="font-Poppins text-2xl sm:text-3xl md:text-4xl font-bold text-[#302711] leading-tight">
          Welcome Back
        </h1>
        <p className="font-Inter text-sm sm:text-base text-[#666666] mt-2">
          Please log in to your account.
        </p>
      </div>

      <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#D9F5FF] border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <div className="relative">
            <label className="block font-Inter text-sm text-[#4B5563] mb-2">
              Email Address
            </label>
            <div className="absolute left-3 top-9 transform translate-y-1/2 text-gray-500">
              <CiMail size={18} />
            </div>
            <input
              type="email"
              placeholder="stevejeremy@yahoo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              required
            />
          </div>

          <div className="relative">
            <label className="block font-Inter text-sm text-[#4B5563] mb-2">
              Password
            </label>
            <div className="absolute left-3 top-9 transform translate-y-1/2 text-gray-500">
              <CiLock size={18} />
            </div>
            <div
              className="absolute right-3 top-9 transform translate-y-1/2 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <IoEyeOffOutline size={18} />
              ) : (
                <IoEyeOutline size={18} />
              )}
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setRememberMe((prev) => !prev)}
            >
              <IoIosCheckboxOutline
                className={`text-lg ${
                  rememberMe ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <p className="font-Inter text-[#2E2E30]">Remember Me</p>
            </div>
            <p className="text-[#3B82F6] font-Inter cursor-pointer hover:underline">
              Forgot Password?
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-lg text-white font-Inter text-sm font-medium transition ${
              loading
                ? "bg-[#24559F]/70 cursor-not-allowed"
                : "bg-[#3B82F6] hover:bg-[#2D6AC9]"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="text-center mt-4">
            <p className="font-Inter text-sm text-[#000000E5]">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={() => navigate("/register/account")}
                className="text-[#3B82F6] font-medium hover:underline bg-transparent border-none cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signin;