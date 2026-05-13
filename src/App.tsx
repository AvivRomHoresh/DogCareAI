import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AssistantPage } from './pages/AssistantPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { DogProfilePage } from './pages/DogProfilePage';
import { RemindersPage } from './pages/RemindersPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dog-profile" element={<DogProfilePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
