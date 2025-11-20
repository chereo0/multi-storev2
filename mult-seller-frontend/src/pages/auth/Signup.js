import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new AuthPage with signup tab active
    navigate('/auth?tab=signup');
  }, [navigate]);

  return null; // This component will redirect immediately
};

export default Signup;
