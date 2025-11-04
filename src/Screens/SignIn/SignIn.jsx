import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, XIcon } from 'lucide-react';
import MainHeader from '../../Components/Header/Header';
import { auth } from '../../Database/config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const navigate = useNavigate();

  const handleLogin = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .catch(error => alert(error.message));
  };

  const handleResetPassword = () => {
    if (!resetEmail) {
      alert("Please enter your email");
      return;
    }

    auth
      .sendPasswordResetEmail(resetEmail)
      .then(() => {
        alert("Password reset email sent!");
        setShowForgotModal(false);
        setResetEmail('');
      })
      .catch(error => alert(error.message));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigate('/home');
      }
    });
    return unsubscribe;
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <MainHeader />

      {/* Centered Form */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h1>

          <form className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <input
                type="email"
                className="w-full bg-gray-100 text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#17304a] outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-gray-100 text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#17304a] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-[#17304a] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-[#17304a] text-white font-medium rounded-lg py-3 mt-2 hover:bg-[#1d3c5c] transition duration-300"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-[#17304a] font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <XIcon size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-3">
              Enter your email address and we’ll send you a link to reset your password.
            </p>
            <input
              type="email"
              className="w-full bg-gray-100 text-black p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#17304a] outline-none mb-4"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Your email address"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-[#17304a] text-white py-2 rounded-lg hover:bg-[#1d3c5c] transition"
            >
              Send Reset Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
