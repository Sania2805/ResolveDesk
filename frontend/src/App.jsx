import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import StatCards from './components/StatCards';
import TicketModal from './components/TicketModal';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';

import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';

import {
  fetchHealth,
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  analyzeTicket,
  fetchTickets,
  approveTicketResolution,
  routeTicket,
  fetchAuditLog,
  fetchAnalytics,
  clearAllTickets
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type
      }
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((t) => t.id !== id)
      );
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.filter((t) => t.id !== id)
    );
  };

  // Fetch initial data
  const refreshData = async () => {
    try {
      const [h, t, a] = await Promise.all([
        fetchHealth(),
        fetchTickets(),
        fetchAnalytics()
      ]);

      setHealth(h);
      setTickets(t);
      setAnalytics(a);

      // Audit log only accessible to admin
      try {
        const l = await fetchAuditLog(150);
        setAuditLogs(l);
      } catch {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error(
        'Error refreshing app data:',
        err
      );
    }
  };

  // Check auth session on startup
  useEffect(() => {
    async function initAuth() {
      try {
        const user = await fetchCurrentUser();

        if (user) {
          setCurrentUser(user);
          await refreshData();
        } else {
          setShowAuthModal(true);
        }
      } catch (err) {
        console.error(
          'Authentication check failed:',
          err
        );

        setShowAuthModal(true);
      }
    }

    initAuth();

    const timer = setInterval(() => {
      fetchHealth()
        .then(setHealth)
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // When user switches or logs in, refresh data
  const handleLogin = async (email, password) => {
    setIsAuthenticating(true);

    try {
      const res = await loginUser(
        email,
        password
      );

      setCurrentUser(res.user);
      setShowAuthModal(false);
      setCurrentAnalysis(null);
      setSelectedTicket(null);

      showToast(
        `Welcome, ${res.user.name}! Switched to ${
          res.user.role === 'admin'
            ? 'Admin IT Desk'
            : 'Requester'
        } mode.`,
        'success'
      );

      await refreshData();
      setActiveTab('dashboard');
    } catch (err) {
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (
    email,
    name,
    password,
    role
  ) => {
    setIsAuthenticating(true);

    try {
      const res = await registerUser(
        email,
        name,
        password,
        role
      );

      setCurrentUser(res.user);
      setShowAuthModal(false);
      setCurrentAnalysis(null);
      setSelectedTicket(null);

      showToast(
        `Account created! Welcome, ${res.user.name}.`,
        'success'
      );

      await refreshData();
      setActiveTab('dashboard');
    } catch (err) {
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = () => {
    logoutUser();

    setCurrentUser(null);
    setShowAuthModal(true);
    setTickets([]);
    setAnalytics(null);
    setAuditLogs([]);

    showToast(
      'Signed out successfully.',
      'info'
    );
  };

  // Handle Analyze Ticket
  const handleAnalyze = async (
    description,
    ticketId
  ) => {
    setIsAnalyzing(true);

    try {
      const result = await analyzeTicket(
        description,
        ticketId
      );

      setCurrentAnalysis(result);

      showToast(
        `Analyzed ${result.ticket_id}: Classified as ${
          result.category
        } (${Math.round(
          result.confidence * 100
        )}% confidence)`,
        'success'
      );

      await refreshData();
    } catch (err) {
      showToast(
        err.message ||
          'AI analysis failed. Check backend configuration.',
        'error'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Approve Resolution
  const handleApprove = async (ticketId) => {
    setIsProcessingAction(true);

    try {
      const updated =
        await approveTicketResolution(ticketId);

      if (
        currentAnalysis &&
        currentAnalysis.ticket_id === ticketId
      ) {
        setCurrentAnalysis(updated);
      }

      if (
        selectedTicket &&
        selectedTicket.ticket_id === ticketId
      ) {
        setSelectedTicket(updated);
      }

      showToast(
        `Resolution approved! Ticket ${ticketId} marked as Resolved.`,
        'success'
      );

      await refreshData();
    } catch (err) {
      showToast(
        err.message ||
          'Failed to approve resolution.',
        'error'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Route Ticket
  const handleRoute = async (ticketId) => {
    setIsProcessingAction(true);

    try {
      const updated =
        await routeTicket(ticketId);

      if (
        currentAnalysis &&
        currentAnalysis.ticket_id === ticketId
      ) {
        setCurrentAnalysis(updated);
      }

      if (
        selectedTicket &&
        selectedTicket.ticket_id === ticketId
      ) {
        setSelectedTicket(updated);
      }

      showToast(
        `Ticket ${ticketId} routed to ${updated.assigned_team}.`,
        'success'
      );

      await refreshData();
    } catch (err) {
      showToast(
        err.message ||
          'Failed to route ticket.',
        'error'
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Clear All Tickets (Admin only)
  const handleClearTickets = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear all tickets and audit logs? This will leave your workspace completely clean.'
      )
    ) {
      return;
    }

    setIsClearing(true);

    try {
      const res =
        await clearAllTickets();

      setCurrentAnalysis(null);
      setSelectedTicket(null);

      showToast(
        res.message ||
          'All tickets cleared successfully.',
        'success'
      );

      await refreshData();
    } catch (err) {
      showToast(
        'Failed to clear tickets.',
        'error'
      );
    } finally {
      setIsClearing(false);
    }
  };

  const isAdmin =
    currentUser?.role === 'admin';

  return (
    <div className="app-container">

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* Main Layout */}
      <div className="main-layout">

        <TopBar
          health={health}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenAuth={() =>
            setShowAuthModal(true)
          }
        />

        <main className="content-body">

          {/* Stat Cards shown across views */}
          <StatCards
            analytics={analytics}
          />

          {/* Active View Routing */}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              currentAnalysis={currentAnalysis}
              onApprove={handleApprove}
              onRoute={handleRoute}
              isProcessingAction={
                isProcessingAction
              }
              recentTickets={tickets}
              onSelectTicket={(t) =>
                setSelectedTicket(t)
              }
              currentUser={currentUser}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsPage
              tickets={tickets}
              onSelectTicket={(t) =>
                setSelectedTicket(t)
              }
              currentUser={currentUser}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              analytics={analytics}
            />
          )}

          {activeTab === 'audit-log' &&
            isAdmin && (
              <AuditLogPage
                auditLogs={auditLogs}
                onRefresh={refreshData}
              />
            )}

          {activeTab === 'settings' &&
            isAdmin && (
              <SettingsPage
                health={health}
                onClearTickets={
                  handleClearTickets
                }
                isClearing={isClearing}
                currentUser={currentUser}
              />
            )}
        </main>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() =>
            setSelectedTicket(null)
          }
          onApprove={handleApprove}
          onRoute={handleRoute}
          isProcessingAction={
            isProcessingAction
          }
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onLogin={handleLogin}
          onRegister={handleRegister}
          isAuthenticating={
            isAuthenticating
          }
          onClose={() =>
            setShowAuthModal(false)
          }
        />
      )}

      {/* Toast Feedback */}
      <Toast
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}