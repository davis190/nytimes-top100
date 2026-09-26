import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import ShowList from "./pages/ShowList";
import Leaderboard from "./pages/Leaderboard";
import Compare from "./pages/Compare";
import Callback from "./pages/Callback";
import { isLoggedIn, login, logout, currentUserClaims } from "./lib/auth";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const claims = currentUserClaims();

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">NYT Top 100</div>
        {loggedIn && (
          <nav>
            <Link to="/">Shows</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </nav>
        )}
        <div className="auth">
          {loggedIn ? (
            <>
              <span className="email">{claims?.email}</span>
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <button onClick={() => login()}>Sign in</button>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/callback" element={<Callback onDone={() => setLoggedIn(true)} />} />
          {loggedIn ? (
            <>
              <Route path="/" element={<ShowList />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/compare/:userId" element={<Compare />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={<Landing />} />
          )}
        </Routes>
      </main>
    </div>
  );
}

function Landing() {
  return (
    <div className="landing">
      <h1>Track your NYT Top 100 shows</h1>
      <p>Sign in to tag shows and compare your list with others.</p>
      <button onClick={() => login()}>Sign in</button>
    </div>
  );
}
