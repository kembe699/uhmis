import React from "react";
import { createRoot } from "react-dom/client";
import AppMySQL from "./App.mysql.tsx";
import "./index.css";
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

// Skip direct database initialization in the main file
// This avoids blocking the initial render and causing connection issues

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
    .then(() => {
      if (!("caches" in window)) return;
      return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    })
    .catch(() => {
      // ignore
    });
}

// Log that we're using MySQL version
console.log('Starting application with MySQL configuration');

// Render the app without waiting for database initialization
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppMySQL />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);

