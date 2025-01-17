import { useNavigate } from 'react-router-dom';

export const HeroActions = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div>
      <button onClick={handleSignUp}>Sign up today</button>
      <button onClick={handleLogin}>log in</button>
    </div>
  );
};
