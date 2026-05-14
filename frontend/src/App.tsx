import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './router';

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
