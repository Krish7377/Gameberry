import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Lobby from './pages/Lobby.jsx';
import Match from './pages/Match.jsx';
import Profile from './pages/Profile.jsx';
import Nav from './components/Nav.jsx';
import { AuthProvider } from './net/AuthContext.jsx';
import { SoundProvider } from './audio/SoundContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <div className="app">
          <Nav />
          <main className="main">
            <Routes>
              {/* Clean Modern Gaming URL Slugs */}
              <Route path="/" element={<Home />} />
              <Route path="/games" element={<Home />} />
              <Route path="/play/:gameId" element={<Match />} />
              <Route path="/play" element={<Match />} />
              <Route path="/arena" element={<Lobby />} />
              <Route path="/lobby" element={<Lobby />} />
              {/* Backward compatibility */}
              <Route path="/match" element={<Match />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </SoundProvider>
    </AuthProvider>
  );
}
