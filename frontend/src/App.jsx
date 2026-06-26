import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './Dashboard';
import './App.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing onEnterDashboard={() => setLoggedIn(true)} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            loggedIn ? (
              <Dashboard onLogout={() => setLoggedIn(false)} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}