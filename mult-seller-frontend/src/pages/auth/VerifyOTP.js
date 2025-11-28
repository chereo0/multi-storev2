import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThreeScene from '../../components/ThreeScene';
import '../../styles/animations.css';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get user data from signup
  const userData = location.state?.userData;
  
  // Refs for OTP inputs
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Redirect if no user data
  useEffect(() => {
    if (!userData) {
      navigate('/signup');
    }
  }, [userData, navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 4);
        const newOtp = [...otp];
        for (let i = 0; i < 4; i++) {
          newOtp[i] = digits[i] || '';
        }
        setOtp(newOtp);
        if (digits.length === 4) {
          inputRefs[3].current?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get client token for authorization
      let token = localStorage.getItem('client_token');
      
      // If no token, get a new one
      if (!token) {
        const { getClientToken } = await import('../../api/services');
        token = await getClientToken();
        if (!token) {
          setError('Authentication failed. Please try again.');
          return;
        }
      }

      const response = await fetch('https://multi-store-api.cloudgoup.com/api/rest/verify_otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userData?.email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      // Handle both success: 1 and success: true patterns
      if (response.ok && (data.success === 1 || data.success === true)) {
        console.log('VerifyOTP: Full API response:', data);
        
        // Extract token first - check all possible locations
        const authToken = data.token || 
                         data.data?.token || 
                         data.auth_token || 
                         data.data?.auth_token ||
                         data.access_token ||
                         data.data?.access_token;
        
        // Extract user ID from all possible locations
        const userId = data.user?.id || 
                      data.data?.user?.id || 
                      data.data?.id ||
                      data.id ||
                      userData?.id;
        
        console.log('VerifyOTP: Extracted userId:', userId);
        console.log('VerifyOTP: Extracted authToken:', authToken);
        
        // Store user data and login
        const userInfo = {
          id: userId,
          name: `${userData.firstname} ${userData.lastname}`,
          email: userData.email,
          username: userData.username,
          telephone: userData.telephone,
          avatar: data.user?.avatar || data.data?.user?.avatar || 'https://via.placeholder.com/40',
          isGuest: false,
          verified: true,
          token: authToken // Include token in userInfo
        };
        
        // Store token in localStorage and sessionStorage
        if (authToken) {
          localStorage.setItem('auth_token', authToken);
          sessionStorage.setItem('auth_token', authToken);
          console.log('VerifyOTP: Stored auth token:', authToken);
        } else {
          // If no auth token returned, use the client token as fallback
          // This allows the user to be logged in even without an auth token
          const clientToken = localStorage.getItem('client_token');
          if (clientToken) {
            localStorage.setItem('auth_token', clientToken);
            sessionStorage.setItem('auth_token', clientToken);
            userInfo.token = clientToken;
            console.log('VerifyOTP: No auth token in response, using client token as fallback');
          } else {
            console.warn('VerifyOTP: No auth token or client token available');
          }
        }
        
        // Store user in both storages
        localStorage.setItem('user', JSON.stringify(userInfo));
        sessionStorage.setItem('user', JSON.stringify(userInfo));
        
        console.log('VerifyOTP: Calling login with userInfo:', userInfo);
        console.log('VerifyOTP: Storage state before login:', {
          localStorage_user: !!localStorage.getItem('user'),
          localStorage_token: !!localStorage.getItem('auth_token'),
          sessionStorage_user: !!sessionStorage.getItem('user'),
          sessionStorage_token: !!sessionStorage.getItem('auth_token')
        });
        
        // Login user with complete userInfo including token
        const loginResult = await login(userInfo);
        
        console.log('VerifyOTP: Login result:', loginResult);
        console.log('VerifyOTP: Storage state after login:', {
          localStorage_user: !!localStorage.getItem('user'),
          localStorage_token: !!localStorage.getItem('auth_token'),
          sessionStorage_user: !!sessionStorage.getItem('user'),
          sessionStorage_token: !!sessionStorage.getItem('auth_token')
        });
        
        // Small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to homepage
        navigate('/home');
      } else {
        // Handle 401 unauthorized - try to get new token and retry once
        if (response.status === 401) {
          const { getClientToken } = await import('../../api/services');
          const newToken = await getClientToken();
          if (newToken) {
            // Retry the request with new token
            const retryResponse = await fetch('https://multi-store-api.cloudgoup.com/api/rest/verify_otp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                email: userData?.email,
                otp: otpCode,
              }),
            });
            
            const retryData = await retryResponse.json();
            
            if (retryResponse.ok && (retryData.success === 1 || retryData.success === true)) {
              // Extract token first
              const authToken = retryData.token || retryData.data?.token || retryData.auth_token || retryData.data?.auth_token;
              
              // Same success handling as above
              const userInfo = {
                id: userData.id || retryData.user?.id || retryData.data?.user?.id,
                name: `${userData.firstname} ${userData.lastname}`,
                email: userData.email,
                username: userData.username,
                telephone: userData.telephone,
                avatar: retryData.user?.avatar || retryData.data?.user?.avatar || 'https://via.placeholder.com/40',
                isGuest: false,
                verified: true,
                token: authToken // Include token in userInfo
              };
              
              // Store token in localStorage and sessionStorage
              if (authToken) {
                localStorage.setItem('auth_token', authToken);
                sessionStorage.setItem('auth_token', authToken);
                console.log('VerifyOTP (retry): Stored auth token:', authToken);
              }
              
              // Store user in both storages
              localStorage.setItem('user', JSON.stringify(userInfo));
              sessionStorage.setItem('user', JSON.stringify(userInfo));
              
              await login(userInfo);
              navigate('/home');
              return;
            } else {
              setError(retryData.message || retryData.error || 'Invalid verification code. Please try again.');
            }
          } else {
            setError('Authentication failed. Please try again.');
          }
        } else {
          setError(data.message || data.error || 'Invalid verification code. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    setError('');

    try {
      // Get client token for authorization
      let token = localStorage.getItem('client_token');
      
      // If no token, get a new one
      if (!token) {
        const { getClientToken } = await import('../../api/services');
        token = await getClientToken();
        if (!token) {
          setError('Authentication failed. Please try again.');
          return;
        }
      }

      const response = await fetch('https://multi-store-api.cloudgoup.com/api/rest/resend_otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userData?.email,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success === 1 || data.success === true)) {
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
      } else {
        setError(data.message || data.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative" style={{ backgroundColor: '#F9FAFB' }}>
      {/* 3D Animated Background */}
      <ThreeScene formInteraction={otp.filter(digit => digit).length} />
      
      {/* Enhanced background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 70%, transparent 100%)' }} />
        <div className="absolute top-20 -right-10 w-56 h-56 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 70%, transparent 100%)' }} />
        <div className="absolute bottom-10 left-1/3 w-32 h-32 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 70%, transparent 100%)', animationDelay: '1s' }} />
      </div>

      <div className={`max-w-md w-full transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        <div className="bg-white/95 backdrop-blur-xl border border-blue-100/50 shadow-2xl rounded-3xl p-6 sm:p-8 relative z-10 glass-effect hover-lift" style={{ boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.05)' }}>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#3B82F6' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: '#111827' }}>
              Verify Your Email
            </h2>
            <div className="w-16 h-1 mx-auto rounded-full mb-4" style={{ background: 'linear-gradient(90deg, #3B82F6, #F59E0B)' }}></div>
            <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
              We've sent a 4-digit verification code to
            </p>
            <p className="font-semibold" style={{ color: '#111827' }}>
              {userData?.email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="flex justify-center space-x-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white shadow-lg transition-all duration-300 focus:outline-none transform hover:scale-105"
                  style={{
                    color: '#111827',
                    borderColor: digit ? '#3B82F6' : '#E5E7EB',
                    boxShadow: digit ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border p-4 text-sm shadow-lg backdrop-blur-sm" style={{ borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                <span className="text-lg">⚠️</span>
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 4}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold text-white shadow-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 active:scale-95 transform-gpu"
              style={{
                backgroundColor: '#3B82F6',
                boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
                '--tw-ring-color': 'rgba(59, 130, 246, 0.5)'
              }}
            >
              {loading ? (
                <span className="loading-dots">Verifying</span>
              ) : (
                '✨ Verify Code ✨'
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || resendLoading}
                className="font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: canResend ? '#F59E0B' : '#6B7280' }}
              >
                {resendLoading ? (
                  'Sending...'
                ) : canResend ? (
                  'Resend Code'
                ) : (
                  `Resend in ${countdown}s`
                )}
              </button>
            </div>

            {/* Back to Signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: '#6B7280' }}
              >
                ← Back to Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
