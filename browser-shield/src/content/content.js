/**
 * ORION Browser Shield — Content Script
 * 
 * Auto-analyzes web pages on load and protects against phishing, credential harvesting,
 * and malicious portals in real-time.
 * 
 * Strict Privacy Guard:
 * - NO passwords or typed inputs captured (values sanitized client-side).
 * - NO keystroke logging, cookies, or authorization tokens captured.
 * - Extracts only bounded security signals (URL, title, form actions, password field presence).
 */

(function () {
  if (window.__orion_shield_injected) return;
  window.__orion_shield_injected = true;

  // Extract bounded non-sensitive security signals from CURRENT PAGE
  function extractPageSignals() {
    const pageUrl = window.location.href;
    const pageTitle = document.title || '';

    // Check presence of password inputs without reading any entered values
    const hasPasswordField = !!document.querySelector('input[type="password"]');

    // Form action targets (where forms post credentials or data)
    const forms = Array.from(document.querySelectorAll('form'));
    const formActions = forms.map((f) => f.getAttribute('action') || '').filter(Boolean);

    // Claimed brand cues from title or meta tags
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
    const metaAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content');
    const claimedBrand = ogSiteName || metaAuthor || null;

    // Visible text snippet for contextual threat classification
    const bodyText = document.body ? (document.body.innerText || '').replace(/\s+/g, ' ').trim() : '';
    const visibleSnippet = bodyText.slice(0, 600);

    return {
      action: 'ANALYZE_PAGE',
      url: pageUrl,
      title: pageTitle,
      has_password_field: hasPasswordField,
      form_actions: formActions.slice(0, 5),
      claimed_brand: claimedBrand,
      visible_text_snippet: visibleSnippet,
    };
  }

  // Execute page analysis and handle security banner
  function runPageAnalysis(callback) {
    if (!window.location.protocol.startsWith('http')) return;

    const payload = extractPageSignals();
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.debug('ORION Shield: Background service worker unreachable.');
        if (callback) callback({ error: true, explanation: 'Service unreachable' });
        return;
      }

      if (response && ['MEDIUM', 'HIGH', 'CRITICAL'].includes(response.risk_level)) {
        renderSecurityBanner(response);
      }

      if (callback) callback(response);
    });
  }

  // Listen for manual triggers from popup or context menu
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'TRIGGER_PAGE_ANALYSIS') {
      runPageAnalysis((res) => {
        sendResponse(res);
      });
      return true; // Keep message channel open for async response
    }
  });

  // AUTO ANALYZE WEB PAGES ON LOAD
  function initAutoAnalysis() {
    if (!window.location.protocol.startsWith('http')) return;
    runPageAnalysis();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAutoAnalysis, 350);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(initAutoAnalysis, 350));
  }

  // -------------------------------------------------------------
  // WEBMAIL & MESSAGING INLINE ASSISTANT
  // -------------------------------------------------------------
  function setupWebmailHelper() {
    const host = window.location.hostname;
    if (!host.includes('mail.google.com') && !host.includes('outlook') && !host.includes('webmail')) {
      return;
    }

    setInterval(() => {
      if (document.getElementById('orion-email-check-btn')) return;

      const emailHeaders = document.querySelector(".ha, .bA, [role='main'] h2, .a3s, .EmailHeader");
      if (emailHeaders) {
        const btn = document.createElement('button');
        btn.id = 'orion-email-check-btn';
        btn.innerHTML = `🛡️ Check email with ORION`;
        btn.style.cssText = `
          background: rgba(110, 231, 255, 0.12);
          border: 1px solid rgba(110, 231, 255, 0.35);
          color: #6ee7ff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          margin: 6px 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const emailSubject = document.title || 'Webmail Item';
          const visibleText = (document.querySelector('.a3s, .EmailBody')?.innerText || '').slice(0, 1000);
          const frontendUrl = (typeof ORION_CONFIG !== 'undefined' && ORION_CONFIG.FRONTEND_URL)
            ? ORION_CONFIG.FRONTEND_URL
            : 'http://localhost:5173';
          const encoded = encodeURIComponent(`Subject: ${emailSubject}\n\n${visibleText}`);
          window.open(`${frontendUrl}/?tab=check&category=message&text=${encoded}`, '_blank');
        };

        emailHeaders.appendChild(btn);
      }
    }, 2500);
  }

  setupWebmailHelper();

  // -------------------------------------------------------------
  // HIGH / CRITICAL THREAT WARNING BANNER
  // -------------------------------------------------------------
  function renderSecurityBanner(incident) {
    if (document.getElementById('orion-shield-banner')) return;

    const isCritical = incident.risk_level === 'CRITICAL';
    const isMedium = incident.risk_level === 'MEDIUM';
    
    const banner = document.createElement('div');
    banner.id = 'orion-shield-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: linear-gradient(135deg, ${isCritical ? '#260408' : isMedium ? '#1a1405' : '#1e1104'} 0%, ${isCritical ? '#3d0810' : isMedium ? '#302408' : '#331b05'} 100%);
      color: #fff;
      border-bottom: 2px solid ${isCritical ? '#ff3b5f' : isMedium ? '#fbbf24' : '#ffc857'};
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      animation: orionSlideDown 0.3s ease-out;
    `;

    const headline = isCritical
      ? 'ORION detected indicators associated with a potentially malicious website.'
      : isMedium
      ? 'ORION detected suspicious signals on this page.'
      : 'ORION detected multiple high-risk signals on this page.';

    const subtitle = isCritical
      ? 'Strong indicators associated with credential harvesting. Avoid entering passwords or payment details.'
      : isMedium
      ? (incident.explanation || 'Exercise caution when interacting with this site.')
      : (incident.explanation || 'This page shows multiple signs associated with phishing.');

    const investigateUrl = (typeof ORION_CONFIG !== 'undefined' && ORION_CONFIG.getIncidentUrl)
      ? ORION_CONFIG.getIncidentUrl(incident.id)
      : `http://localhost:5173/?tab=incidents&id=${encodeURIComponent(incident.id || '')}`;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
        <span style="background: ${isCritical ? '#ff3b5f' : isMedium ? '#fbbf24' : '#ffc857'}; color: #05070d; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">
          ${incident.risk_level} RISK
        </span>
        <div style="flex: 1;">
          <strong style="font-size: 13px; color: #ffffff; display: block; margin-bottom: 2px;">${headline}</strong>
          <p style="margin: 0; font-size: 12px; color: ${isCritical ? '#fca5a5' : isMedium ? '#fde68a' : '#fcd34d'}; line-height: 1.3;">
            ${subtitle}
          </p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
        <a href="${investigateUrl}" target="_blank" style="background: #0284c7; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 6px; border: 1px solid #38bdf8; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);">
          Open ORION
        </a>
        <button id="orion-dismiss-btn" title="Dismiss warning" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-weight: 600;">
          Dismiss
        </button>
      </div>
    `;

    if (!document.getElementById('orion-shield-styles')) {
      const style = document.createElement('style');
      style.id = 'orion-shield-styles';
      style.textContent = `
        @keyframes orionSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);
    document.getElementById('orion-dismiss-btn').onclick = () => banner.remove();
  }
})();
