import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import PublicHome from './components/public/PublicHome';
import CheckSomething from './components/public/CheckSomething';
import PublicAlerts from './components/public/PublicAlerts';
import MobileAppView from './components/public/MobileAppView';
import PricingView from './components/public/PricingView';
import BrowserShieldInfoView from './components/public/BrowserShieldInfoView';
import LoginView from './components/auth/LoginView';
import SignupView from './components/auth/SignupView';
import ForgotPasswordView from './components/auth/ForgotPasswordView';
import AuthTransition from './components/auth/AuthTransition';
import RequireAuth from './components/auth/RequireAuth';
import UserAppShell from './components/app/UserAppShell';
import UserDashboard from './components/app/UserDashboard';
import MyChecksView from './components/app/MyChecksView';
import ProfileView from './components/app/ProfileView';
import SettingsView from './components/app/SettingsView';
import { authService, AuthState } from './services/auth';
import { api } from './services/api';
import './App.css';

// Lazy-load analyst-mode components for optimal performance
const IncidentFeed = lazy(() => import('./components/IncidentFeed'));
const BrowserShieldView = lazy(() => import('./components/BrowserShieldView'));
const SystemStatusView = lazy(() => import('./components/SystemStatusView'));
const IdentityRegistryView = lazy(() => import('./components/IdentityRegistryView'));
const IncidentDrawer = lazy(() => import('./components/IncidentDrawer'));

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  // Public tabs: 'home' | 'shield-info' | 'mobile-app' | 'pricing' | 'login' | 'signup' | 'forgot-password'
  // Authenticated app tabs: 'app-dashboard' | 'app-check' | 'app-checks' | 'app-alerts' | 'app-browser-shield' | 'app-profile' | 'app-settings'
  // Analyst tabs: 'overview' | 'incidents' | 'shield' | 'system' | 'identities'

  const [isAnalystMode, setIsAnalystMode] = useState(false);
  const [checkCategory, setCheckCategory] = useState('url');
  
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [transitionUser, setTransitionUser] = useState(null);
  const [returnToTab, setReturnToTab] = useState(null);
  const [transitionDestination, setTransitionDestination] = useState('app-dashboard');

  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'CHECKING' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Subscribe to auth service updates
  useEffect(() => {
    const unsubscribe = authService.subscribe(({ user }) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom navigation events
  useEffect(() => {
    const handleCustomNav = (e) => {
      if (e.detail) {
        if (e.detail.startsWith('app-') || ['check', 'overview'].includes(e.detail)) {
          navigateWithAuthGate(e.detail);
        } else {
          setActiveTab(e.detail);
        }
      }
    };
    window.addEventListener('orion-navigate', handleCustomNav);
    return () => window.removeEventListener('orion-navigate', handleCustomNav);
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [health, incs] = await Promise.all([
        api.getHealth().catch((err) => {
          console.warn('Backend health check failed:', err);
          return { status: 'UNAVAILABLE', error: true };
        }),
        api.getIncidents(50).catch(() => []),
      ]);

      const isHealthy = health && (
        health.status === 'ok' || 
        health.status === 'healthy' || 
        health.status === 'ONLINE' || 
        health.status === 'online' ||
        health.status?.toLowerCase() === 'online'
      );
      setSystemStatus(isHealthy ? { status: 'ONLINE', ...health } : { status: 'UNAVAILABLE', ...health });
      if (Array.isArray(incs)) {
        setIncidents(incs);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setSystemStatus({ status: 'UNAVAILABLE', error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Helper for auth-gated navigation
  const navigateWithAuthGate = (targetTab, category = null) => {
    if (category) setCheckCategory(category);
    const isAuth = authService.isAuthenticated() || !!currentUser;
    if (isAuth) {
      if (targetTab === 'check') {
        setActiveTab('app-check');
      } else {
        setActiveTab(targetTab);
      }
    } else {
      setReturnToTab(targetTab === 'check' ? 'app-check' : targetTab);
      setActiveTab('login');
    }
  };

  // Handle URL deep-linking
  useEffect(() => {
    const handleUrlNavigation = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        const returnToParam = searchParams.get('returnTo');
        const idParam = searchParams.get('id') || searchParams.get('incidentId');
        
        let pathId = null;
        if (window.location.pathname.startsWith('/incidents/')) {
          pathId = window.location.pathname.replace('/incidents/', '').split('/')[0].trim();
        }

        const targetId = idParam || pathId;

        if (returnToParam) {
          setReturnToTab(returnToParam);
        }

        if (tabParam) {
          if (['pricing', 'mobile-app', 'shield-info', 'home'].includes(tabParam)) {
            setActiveTab(tabParam);
          } else {
            navigateWithAuthGate(tabParam);
          }
          if (['overview', 'incidents', 'intel', 'system', 'evaluation', 'identities'].includes(tabParam)) {
            setIsAnalystMode(true);
          }
        } else if (targetId) {
          setActiveTab('incidents');
          setIsAnalystMode(true);
        }

        if (targetId) {
          try {
            const incident = await api.getIncidentById(targetId);
            if (incident && incident.id) {
              setSelectedIncident(incident);
            }
          } catch (fetchErr) {
            console.warn('Could not load deep-linked incident:', fetchErr);
          }
        }
      } catch (err) {
        console.debug('URL navigation error:', err);
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    return () => window.removeEventListener('popstate', handleUrlNavigation);
  }, []);

  const handleIncidentGenerated = (newIncident) => {
    if (!newIncident) return;
    setIncidents(prev => [newIncident, ...prev.filter(i => i.id !== newIncident.id)]);
    setNotification(`New ${newIncident.threat_type?.toUpperCase() || 'THREAT'} analyzed: ${newIncident.title}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleActionExecuted = (incidentId, action) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'RESOLVED',
        };
      }
      return inc;
    }));
    setNotification(`Action Dispatched: ${action.title}`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInspectTechnical = (incident) => {
    if (incident) {
      setSelectedIncident(incident);
    }
  };

  const handleLoginSuccess = (user) => {
    setTransitionUser(user);
    const dest = returnToTab || 'app-dashboard';
    setTransitionDestination(dest);
    setReturnToTab(null);
    setActiveTab('auth-transition');
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setActiveTab('home');
    setNotification('Signed out from personal workspace');
    setTimeout(() => setNotification(null), 3000);
  };

  // Determine if the current tab belongs to the Authenticated User Workspace
  const isUserAppTab = activeTab.startsWith('app-');

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{notification}</span>
        </div>
      )}

      {/* Global Header (Rendered on Public and Analyst pages) */}
      {!isUserAppTab && activeTab !== 'auth-transition' && (
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (['app-dashboard', 'app-check', 'app-checks', 'app-alerts', 'app-browser-shield', 'app-profile', 'app-settings', 'check', 'overview'].includes(tab)) {
              navigateWithAuthGate(tab);
            } else {
              setActiveTab(tab);
            }
          }}
          systemStatus={systemStatus}
          incidentCount={incidents.length}
          isAnalystMode={isAnalystMode}
          setIsAnalystMode={setIsAnalystMode}
          currentUser={currentUser}
          onNavigateToLogin={() => {
            setReturnToTab(null);
            setActiveTab('login');
          }}
          onNavigateToApp={(tab) => navigateWithAuthGate(tab || 'app-dashboard')}
        />
      )}

      {/* Auth Verification Transition Screen */}
      {activeTab === 'auth-transition' && (
        <AuthTransition
          user={transitionUser || currentUser}
          onComplete={() => setActiveTab(transitionDestination || 'app-dashboard')}
        />
      )}

      {/* Authenticated User Application Shell */}
      {isUserAppTab && (
        <RequireAuth
          currentUser={currentUser}
          intendedTab={activeTab}
          onNavigateToLogin={(ret) => {
            setReturnToTab(ret || activeTab);
            setActiveTab('login');
          }}
          onNavigateToSignup={(ret) => {
            setReturnToTab(ret || activeTab);
            setActiveTab('signup');
          }}
        >
          <UserAppShell
            currentTab={activeTab}
            onNavigate={(tab) => setActiveTab(tab)}
            onSwitchToAnalyst={() => {
              setIsAnalystMode(true);
              setActiveTab('overview');
            }}
            onSignOut={handleSignOut}
          >
            {activeTab === 'app-dashboard' && (
              <UserDashboard
                onNavigateToCheck={() => setActiveTab('app-check')}
                onNavigateToChecks={() => setActiveTab('app-checks')}
                onNavigateToAlerts={() => setActiveTab('app-alerts')}
              />
            )}

            {activeTab === 'app-check' && (
              <CheckSomething
                initialCategory={checkCategory}
                onInspectTechnical={handleInspectTechnical}
                onIncidentCreated={handleIncidentGenerated}
              />
            )}

            {activeTab === 'app-checks' && (
              <MyChecksView
                onNavigateToCheck={() => setActiveTab('app-check')}
              />
            )}

            {activeTab === 'app-alerts' && (
              <PublicAlerts
                incidents={incidents}
                onSelectIncident={setSelectedIncident}
              />
            )}

            {activeTab === 'app-browser-shield' && (
              <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading Browser Shield...</div>}>
                <BrowserShieldView
                  onInspectTechnical={handleInspectTechnical}
                  onIncidentCreated={handleIncidentGenerated}
                  recentIncidents={incidents.filter(i => 
                    (i.source || '').toLowerCase().includes('browser') || 
                    (i.input_type || '').toLowerCase().includes('browser') || 
                    (i.input_type || '').toLowerCase().includes('url')
                  )}
                />
              </Suspense>
            )}

            {activeTab === 'app-profile' && <ProfileView />}
            {activeTab === 'app-settings' && <SettingsView />}
          </UserAppShell>
        </RequireAuth>
      )}

      {/* Public & Analyst Main Content Area */}
      {!isUserAppTab && activeTab !== 'auth-transition' && (
        <main className="main-content">
          <Suspense fallback={
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Security Module...</div>
            </div>
          }>
            {/* PUBLIC PAGES */}
            {activeTab === 'home' && (
              <PublicHome
                onSelectCategory={(category) => {
                  navigateWithAuthGate('app-check', category);
                }}
                onNavigateToCheck={() => navigateWithAuthGate('app-check')}
                onNavigateToLogin={() => {
                  setReturnToTab('app-check');
                  setActiveTab('login');
                }}
                onNavigateToBrowserShield={() => setActiveTab('shield-info')}
                onNavigateToMobileApp={() => setActiveTab('mobile-app')}
                onNavigateToPricing={() => setActiveTab('pricing')}
                isAuthenticated={!!currentUser}
              />
            )}

            {activeTab === 'shield-info' && (
              <BrowserShieldInfoView
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'app-browser-shield');
                  setActiveTab('login');
                }}
                onNavigateToApp={(tab) => navigateWithAuthGate(tab || 'app-browser-shield')}
                isAuthenticated={!!currentUser}
              />
            )}

            {activeTab === 'mobile-app' && (
              <MobileAppView
                onNavigateToCheck={() => navigateWithAuthGate('app-check')}
                onNavigateToLogin={() => {
                  setReturnToTab('app-check');
                  setActiveTab('login');
                }}
                isAuthenticated={!!currentUser}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingView
                onNavigateToSignup={(ret) => {
                  setReturnToTab(ret || 'app-check');
                  setActiveTab('signup');
                }}
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'app-check');
                  setActiveTab('login');
                }}
                onSwitchToAnalyst={() => navigateWithAuthGate('overview')}
                isAuthenticated={!!currentUser}
              />
            )}

            {(activeTab === 'check' || activeTab === 'analyze') && (
              <RequireAuth
                currentUser={currentUser}
                intendedTab="app-check"
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'app-check');
                  setActiveTab('login');
                }}
                onNavigateToSignup={(ret) => {
                  setReturnToTab(ret || 'app-check');
                  setActiveTab('signup');
                }}
              >
                <CheckSomething
                  initialCategory={checkCategory}
                  onInspectTechnical={handleInspectTechnical}
                  onIncidentCreated={handleIncidentGenerated}
                />
              </RequireAuth>
            )}

            {activeTab === 'alerts' && (
              <PublicAlerts
                incidents={incidents}
                onSelectIncident={setSelectedIncident}
              />
            )}

            {/* AUTHENTICATION PAGES */}
            {activeTab === 'login' && (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
                onNavigateToForgot={() => setActiveTab('forgot-password')}
                onBackToPublic={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'signup' && (
              <SignupView
                onSignupSuccess={handleLoginSuccess}
                onNavigateToLogin={() => setActiveTab('login')}
                onBackToPublic={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'forgot-password' && (
              <ForgotPasswordView
                onNavigateToLogin={() => setActiveTab('login')}
                onBackToPublic={() => setActiveTab('home')}
              />
            )}

            {/* ANALYST SOC PAGES */}
            {activeTab === 'overview' && (
              <RequireAuth
                title="Analyst Access Required"
                description="Sign in with security credentials to access the ORION SOC Command Center and Threat Intelligence engine."
                currentUser={currentUser}
                intendedTab="overview"
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'overview');
                  setActiveTab('login');
                }}
                onNavigateToSignup={(ret) => {
                  setReturnToTab(ret || 'overview');
                  setActiveTab('signup');
                }}
              >
                <IncidentFeed
                  viewMode="overview"
                  incidents={incidents}
                  onSelectIncident={setSelectedIncident}
                  onRefresh={loadData}
                  loading={loading}
                  systemStatus={systemStatus}
                />
              </RequireAuth>
            )}

            {activeTab === 'incidents' && (
              <RequireAuth
                title="Analyst Access Required"
                description="Sign in with security credentials to access the ORION SOC Incident Feed."
                currentUser={currentUser}
                intendedTab="incidents"
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'incidents');
                  setActiveTab('login');
                }}
                onNavigateToSignup={(ret) => {
                  setReturnToTab(ret || 'incidents');
                  setActiveTab('signup');
                }}
              >
                <IncidentFeed
                  viewMode="incidents"
                  incidents={incidents}
                  onSelectIncident={setSelectedIncident}
                  onRefresh={loadData}
                  loading={loading}
                  systemStatus={systemStatus}
                />
              </RequireAuth>
            )}

            {activeTab === 'shield' && (
              <RequireAuth
                title="Analyst Access Required"
                description="Sign in with security credentials to access Browser Shield SOC analytics."
                currentUser={currentUser}
                intendedTab="shield"
                onNavigateToLogin={(ret) => {
                  setReturnToTab(ret || 'shield');
                  setActiveTab('login');
                }}
                onNavigateToSignup={(ret) => {
                  setReturnToTab(ret || 'shield');
                  setActiveTab('signup');
                }}
              >
                <BrowserShieldView
                  onInspectTechnical={handleInspectTechnical}
                  onIncidentCreated={handleIncidentGenerated}
                  recentIncidents={incidents.filter(i => 
                    (i.source || '').toLowerCase().includes('browser') || 
                    (i.input_type || '').toLowerCase().includes('browser') || 
                    (i.input_type || '').toLowerCase().includes('url')
                  )}
                />
              </RequireAuth>
            )}

            {activeTab === 'system' && (
              <SystemStatusView systemStatus={systemStatus} />
            )}

            {activeTab === 'identities' && (
              <IdentityRegistryView />
            )}
          </Suspense>
        </main>
      )}

      {/* Technical SOC Incident Drawer (Available anywhere an incident is selected) */}
      <Suspense fallback={null}>
        {selectedIncident && (
          <IncidentDrawer
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onActionExecuted={handleActionExecuted}
          />
        )}
      </Suspense>
    </div>
  );
}
