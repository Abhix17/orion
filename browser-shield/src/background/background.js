/**
 * ORION Browser Shield 2.0 — Background Service Worker
 * 
 * Auto-analyzes web pages in background and provides real-time threat detection.
 * Strict Privacy Guard:
 * - NEVER captures passwords, keystrokes, cookies, or session tokens.
 * - Dispatches bounded signals to ORION Gateway (/api/v1/analyze/browser).
 * - Full state machine with deterministic badge mapping.
 */

try {
  importScripts('../config.js');
} catch (e) {
  console.debug('ORION Shield: importScripts config fallback');
}

const API_ENDPOINT = typeof ORION_CONFIG !== 'undefined'
  ? ORION_CONFIG.ANALYZE_BROWSER_URL
  : 'http://localhost:8000/api/v1/analyze/browser';

const FRONTEND_URL = typeof ORION_CONFIG !== 'undefined'
  ? ORION_CONFIG.FRONTEND_URL
  : 'http://localhost:5173';

// -------------------------------------------------------------
// 1. DETERMINISTIC BADGE & STATE MAPPING
// -------------------------------------------------------------
const BADGE_MAP = {
  NOT_ANALYZED: { text: '', color: '#64748B' },
  ANALYZING:    { text: '...', color: '#6EE7FF' },
  SAFE:         { text: 'SAFE', color: '#10B981' },
  LOW:          { text: 'LOW', color: '#38BDF8' },
  MEDIUM:       { text: 'CAUT', color: '#F59E0B' },
  HIGH:         { text: 'WARN', color: '#DC2626' },
  CRITICAL:     { text: 'CRIT', color: '#EF4444' },
  INCONCLUSIVE: { text: '?', color: '#64748B' },
  UNAVAILABLE:  { text: 'ERR', color: '#64748B' },
  ERROR:        { text: 'ERR', color: '#64748B' },
};

function updateTabBadge(tabId, stateKey) {
  if (!tabId) return;
  const cfg = BADGE_MAP[stateKey] || BADGE_MAP.NOT_ANALYZED;
  try {
    chrome.action.setBadgeText({ tabId, text: cfg.text });
    chrome.action.setBadgeBackgroundColor({ tabId, color: cfg.color });
  } catch (e) {
    // Ignore invalid tab exceptions
  }
}

// -------------------------------------------------------------
// 2. CONTEXT MENUS SETUP (Page, Selection, Link, Image)
// -------------------------------------------------------------
function setupContextMenus() {
  try {
    chrome.contextMenus.removeAll(() => {
      // Clear runtime.lastError if removeAll was called when empty
      const err = chrome.runtime.lastError;

      chrome.contextMenus.create({
        id: 'orion-root',
        title: '🛡 Check with ORION',
        contexts: ['page', 'selection', 'link', 'image'],
      }, () => { const e = chrome.runtime.lastError; });

      chrome.contextMenus.create({
        parentId: 'orion-root',
        id: 'orion-analyze-page',
        title: 'Page analysis',
        contexts: ['page'],
      }, () => { const e = chrome.runtime.lastError; });

      chrome.contextMenus.create({
        parentId: 'orion-root',
        id: 'orion-analyze-selection',
        title: 'Message analysis',
        contexts: ['selection'],
      }, () => { const e = chrome.runtime.lastError; });

      chrome.contextMenus.create({
        parentId: 'orion-root',
        id: 'orion-analyze-link',
        title: 'URL analysis',
        contexts: ['link'],
      }, () => { const e = chrome.runtime.lastError; });

      chrome.contextMenus.create({
        parentId: 'orion-root',
        id: 'orion-analyze-image',
        title: 'Image analysis',
        contexts: ['image'],
      }, () => { const e = chrome.runtime.lastError; });
    });
  } catch (e) {
    console.debug('ORION Shield: Context menu setup exception', e);
  }
}

chrome.runtime.onInstalled.addListener(setupContextMenus);
chrome.runtime.onStartup.addListener(setupContextMenus);
// Immediate setup on background service worker execution
setupContextMenus();

// Context Menu Action Dispatcher
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if ((info.menuItemId === 'orion-analyze-page' || info.menuItemId === 'orion-root') && tab) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_PAGE_ANALYSIS' }, (res) => {
        if (chrome.runtime.lastError) {
          // If content script was not ready, fallback to direct background analysis
          handlePageAnalysis({ url: tab.url, title: tab.title }, tab.id, () => {});
        }
      });
    }
  } else if (info.menuItemId === 'orion-analyze-selection' && info.selectionText) {
    const encodedText = encodeURIComponent(info.selectionText);
    chrome.tabs.create({ url: `${FRONTEND_URL}/?tab=check&category=message&text=${encodedText}` });
  } else if (info.menuItemId === 'orion-analyze-link' && info.linkUrl) {
    const encodedUrl = encodeURIComponent(info.linkUrl);
    chrome.tabs.create({ url: `${FRONTEND_URL}/?tab=check&category=url&url=${encodedUrl}` });
  } else if (info.menuItemId === 'orion-analyze-image' && info.srcUrl) {
    const encodedImg = encodeURIComponent(info.srcUrl);
    chrome.tabs.create({ url: `${FRONTEND_URL}/?tab=check&category=image&imageUrl=${encodedImg}` });
  }
});

// -------------------------------------------------------------
// 3. TAB LIFECYCLE: AUTO ANALYSIS ON NAVIGATION
// -------------------------------------------------------------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.storage.local.remove([`tab_${tabId}`]); // PREVENT STALE STATE
    
    if (tab && tab.url && !tab.url.startsWith('http')) {
      updateTabBadge(tabId, 'SAFE');
      return;
    }
    // Show scanning badge while navigating / loading
    updateTabBadge(tabId, 'ANALYZING');
  } else if (changeInfo.status === 'complete' && tab && tab.url) {
    if (!tab.url.startsWith('http')) {
      updateTabBadge(tabId, 'SAFE');
      return;
    }
    // Check if result is already in storage, otherwise remain in ANALYZING until content script finishes
    chrome.storage.local.get([`tab_${tabId}`], (data) => {
      if (data[`tab_${tabId}`]) {
        const lvl = (data[`tab_${tabId}`].risk_level || 'SAFE').toUpperCase();
        updateTabBadge(tabId, lvl);
      } else {
        updateTabBadge(tabId, 'ANALYZING');
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`tab_${tabId}`]);
});

// -------------------------------------------------------------
// 4. RUNTIME MESSAGING HANDLER
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : request.tabId;

  if (request.action === 'ANALYZE_PAGE') {
    handlePageAnalysis(request, tabId, sendResponse);
    return true; // Async channel open
  }

  if (request.action === 'GET_TAB_INCIDENT') {
    const queryTabId = request.tabId || tabId;
    chrome.storage.local.get([`tab_${queryTabId}`], (data) => {
      sendResponse(data[`tab_${queryTabId}`] || null);
    });
    return true;
  }

  if (request.action === 'SET_ANALYZING_STATE') {
    updateTabBadge(tabId, 'ANALYZING');
    sendResponse({ status: 'OK' });
    return false;
  }
});

function redactSensitiveUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    url.hash = ''; // Remove URL fragment
    const sensitiveKeys = new Set([
      'token', 'access_token', 'auth', 'authorization', 'session',
      'session_id', 'password', 'passwd', 'secret', 'api_key', 'key',
      'code', 'otp', 'signature'
    ]);
    const params = new URLSearchParams(url.search);
    let modified = false;
    for (const key of Array.from(params.keys())) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        params.set(key, '[REDACTED]');
        modified = true;
      }
    }
    if (modified) {
      url.search = params.toString();
    }
    return url.toString();
  } catch (e) {
    return rawUrl;
  }
}

// -------------------------------------------------------------
// 5. BOUNDED BACKEND ANALYSIS DISPATCHER
// -------------------------------------------------------------
const urlCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function handlePageAnalysis(pageData, tabId, sendResponse) {
  if (tabId) {
    updateTabBadge(tabId, 'ANALYZING');
  }

  try {
    const rawUrl = pageData.url;
    const now = Date.now();
    const cached = urlCache.get(rawUrl);
    
    let incident;
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      incident = cached.incident;
    } else {
      // Least privilege payload: strictly NO passwords, cookies, or tokens
      const payload = {
        url: redactSensitiveUrl(rawUrl),
        title: pageData.title || '',
        has_password_field: Boolean(pageData.has_password_field),
        form_actions: Array.isArray(pageData.form_actions) ? pageData.form_actions.slice(0, 5) : [],
        claimed_brand: pageData.claimed_brand || null,
        visible_text_snippet: (pageData.visible_text_snippet || '').slice(0, 600),
      };

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`ORION Gateway returned HTTP ${res.status}`);
      }

      incident = await res.json();
      urlCache.set(rawUrl, { incident, timestamp: now });
    }

    const riskLevel = (incident.risk_level || (incident.risk_score && incident.risk_score.level) || 'SAFE').toUpperCase();

    if (tabId) {
      await chrome.storage.local.set({
        [`tab_${tabId}`]: incident,
        latest_incident: incident,
      });

      // Update badge based on explicit state mapping
      updateTabBadge(tabId, riskLevel);

      // Record recent analysis history item
      try {
        const u = new URL(pageData.url);
        const existingData = await chrome.storage.local.get(['recent_analyses']);
        const recents = Array.isArray(existingData.recent_analyses) ? existingData.recent_analyses : [];
        const filtered = recents.filter(r => r.hostname !== u.hostname);
        const updatedRecents = [
          {
            hostname: u.hostname,
            risk_level: riskLevel,
            threat_type: incident.threat_type || 'None',
            incident_id: incident.id || null,
            timestamp: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, 5);
        await chrome.storage.local.set({ recent_analyses: updatedRecents });
      } catch (e) {
        // Ignore non-http scheme errors
      }
    }

    sendResponse(incident);
  } catch (err) {
    console.warn('ORION Shield: Analysis request failed:', err);
    if (tabId) {
      updateTabBadge(tabId, 'UNAVAILABLE');
    }
    // Never convert failure into SAFE
    sendResponse({
      status: 'UNAVAILABLE',
      risk_level: 'UNAVAILABLE',
      error: true,
      explanation: 'Could not reach ORION analysis service. The service is currently offline or unreachable.',
    });
  }
}
