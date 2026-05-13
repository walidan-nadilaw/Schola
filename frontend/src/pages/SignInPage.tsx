import { useNavigate } from 'react-router';
import SignInPageFigma from '@/components/figma/SignInPage';
import { useAuth } from '@/contexts/AuthContext';

export function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async () => {
    // For demo/prototype purposes, we'll just log in with a mock
    // In a real implementation, SignInPageFigma should pass email/password
    try {
      // Assuming successful login for now to show the dashboard
      // login("user@example.com", "password");
      navigate('/dashboard');
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <SignInPageFigma 
      onSignIn={handleSignIn} 
      onBackToHome={() => navigate('/')} 
    />
  );
}
