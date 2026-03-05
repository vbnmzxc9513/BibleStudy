
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import BookSelection from './pages/BookSelection/BookSelection';
import ReadingView from './pages/ReadingView/ReadingView';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="books" element={<BookSelection />} />
              <Route path="read/:bookId/:chapter" element={<ReadingView />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
