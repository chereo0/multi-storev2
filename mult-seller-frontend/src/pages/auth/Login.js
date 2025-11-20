import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new AuthPage with login tab active
    navigate('/auth?tab=login');
  }, [navigate]);

  return null; // This component will redirect immediately
};

export default Login;
