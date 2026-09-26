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
        <div className="brand">
          <span className="brand__mark">TOP</span> 100
        </div>
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
              <button className="btn btn--outline btn--small" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => login()}>
              Sign in
            </button>
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
      <footer className="site-footer">
        Show data and images from{" "}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          TMDb
        </a>
        . Streaming availability from{" "}
        <a href="https://www.justwatch.com/" target="_blank" rel="noreferrer">
          JustWatch
        </a>
        . This product uses the TMDb API but is not endorsed or certified by TMDb.
      </footer>
    </div>
  );
}

function Landing() {
  return (
    <div className="landing">
      <h1>
        Track your <span className="landing__accent">NYT Top 100</span> shows
      </h1>
      <p>Tag every show, see what's trending among friends, and find out where to watch next.</p>
      <button className="btn btn--large" onClick={() => login()}>
        Sign in to get started
      </button>
    </div>
  );
}
