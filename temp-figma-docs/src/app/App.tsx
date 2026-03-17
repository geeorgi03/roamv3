import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './screens/AuthScreen';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--accent-primary)] font-syne text-lg">Loading Roam...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;