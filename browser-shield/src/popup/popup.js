/**
 * ORION Browser Shield — Popup Controller
 * Automatically loads analysis for the active page and displays real-time verdicts.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Site metadata elements
  const hostnameEl = document.getElementById("hostname-text");
  const pageTitleEl = document.getElementById("page-title-text");
  const pillEl = document.getElementById("protection-pill");
  const pillTextEl = document.getElementById("protection-pill-text");
  const siteRiskTagEl = document.getElementById("site-risk-tag");

  // State Views
  const stateNotAnalyzed = document.getElementById("state-not-analyzed");
  const stateAnalyzing = document.getElementById("state-analyzing");
  const stateSafe = document.getElementById("state-safe");
  const stateSuspicious = document.getElementById("state-suspicious");
  const stateDanger = document.getElementById("state-danger");
  const stateInconclusive = document.getElementById("state-inconclusive");
  const stateUnavailable = document.getElementById("state-unavailable");

  // Danger View Content
  const dangerHeadline = document.getElementById("danger-headline");
  const dangerSubline = document.getElementById("danger-subline");
  const dangerWarningMsg = document.getElementById("danger-warning-message");
  const dangerFlagsList = document.getElementById("danger-flags-list");

  // Details Section
  const detailsSection = document.getElementById("details-section");
  const toggleDetailsBtn = document.getElementById("toggle-details-btn");
  const riskScoreDisplay = document.getElementById("risk-score-display");
  const detailThreatType = document.getElementById("detail-threat-type");
  const detailEvidenceList = document.getElementById("detail-evidence-list");

  // Action Buttons
  const primaryAnalyzeBtn = document.getElementById("primary-analyze-btn");
  const reAnalyzeBtn = document.getElementById("re-analyze-btn");
  const investigateBtn = document.getElementById("investigate-btn");
  const goBackBtn = document.getElementById("go-back-btn");
  const retryBtn = document.getElementById("retry-btn");
  const openDashboardBtn = document.getElementById("open-dashboard-btn");

  // Secondary Modality Buttons
  const checkTextBtn = document.getElementById("check-text-btn");
  const checkLinkBtn = document.getElementById("check-link-btn");
  const checkImgBtn = document.getElementById("check-img-btn");

  // Privacy Accordion
  const privacyToggleBtn = document.getElementById("privacy-toggle-btn");
  const privacyContent = document.getElementById("privacy-content");
  const privacyArrow = document.getElementById("privacy-arrow");

  let currentTab = null;
  let currentIncident = null;

  const FRONTEND_URL = (typeof ORION_CONFIG !== "undefined" && ORION_CONFIG.FRONTEND_URL)
    ? ORION_CONFIG.FRONTEND_URL
    : "http://localhost:5173";

  // Setup Dashboard link
  if (openDashboardBtn) {
    openDashboardBtn.href = `${FRONTEND_URL}/`;
  }

  // Wire Secondary Modality Buttons
  if (checkTextBtn) {
    checkTextBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${FRONTEND_URL}/check?tab=message` });
    });
  }
  if (checkLinkBtn) {
    checkLinkBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${FRONTEND_URL}/check?tab=link` });
    });
  }
  if (checkImgBtn) {
    checkImgBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${FRONTEND_URL}/check?tab=image` });
    });
  }

  // Wire Privacy Accordion Toggle
  if (privacyToggleBtn && privacyContent) {
    privacyToggleBtn.addEventListener("click", () => {
      const isHidden = privacyContent.style.display === "none";
      privacyContent.style.display = isHidden ? "block" : "none";
      if (privacyArrow) {
        privacyArrow.textContent = isHidden ? "▲" : "▼";
      }
    });
  }

  // Trigger explicit or auto page analysis
  function triggerPageAnalysis() {
    if (!currentTab || !currentTab.id) return;
    showAnalyzing();

    chrome.tabs.sendMessage(currentTab.id, { action: "TRIGGER_PAGE_ANALYSIS" }, (response) => {
      if (chrome.runtime.lastError) {
        // Fallback: send directly to background worker if content script is not yet responsive
        chrome.runtime.sendMessage(
          {
            action: "ANALYZE_PAGE",
            url: currentTab.url,
            title: currentTab.title || "",
            has_password_field: false,
            form_actions: [],
            claimed_brand: null,
            visible_text_snippet: "",
          },
          (bgRes) => {
            if (bgRes && !bgRes.error) {
              renderIncident(bgRes);
            } else if (bgRes && bgRes.error) {
              showUnavailable(bgRes.explanation);
            } else {
              showUnavailable("Unable to scan current website.");
            }
          }
        );
      } else if (response) {
        renderIncident(response);
      }
    });
  }

  if (primaryAnalyzeBtn) {
    primaryAnalyzeBtn.addEventListener("click", triggerPageAnalysis);
  }
  if (reAnalyzeBtn) {
    reAnalyzeBtn.addEventListener("click", triggerPageAnalysis);
  }

  // Toggle Details
  if (toggleDetailsBtn && detailsSection) {
    toggleDetailsBtn.addEventListener("click", () => {
      const isShown = detailsSection.style.display === "block";
      detailsSection.style.display = isShown ? "none" : "block";
      toggleDetailsBtn.textContent = isShown ? "Toggle Signal Details" : "Hide Signal Details";
    });
  }

  // Go Back Action
  if (goBackBtn) {
    goBackBtn.addEventListener("click", async () => {
      if (currentTab && currentTab.id) {
        try {
          await chrome.tabs.goBack(currentTab.id);
          window.close();
        } catch {
          await chrome.tabs.update(currentTab.id, { url: "about:blank" });
          window.close();
        }
      }
    });
  }

  // Retry Action
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      triggerPageAnalysis();
    });
  }

  // State Switching Functions
  function hideAllStates() {
    if (stateNotAnalyzed) stateNotAnalyzed.style.display = "none";
    if (stateAnalyzing) stateAnalyzing.style.display = "none";
    if (stateSafe) stateSafe.style.display = "none";
    if (stateSuspicious) stateSuspicious.style.display = "none";
    if (stateDanger) stateDanger.style.display = "none";
    if (stateInconclusive) stateInconclusive.style.display = "none";
    if (stateUnavailable) stateUnavailable.style.display = "none";

    if (investigateBtn) investigateBtn.style.display = "none";
    if (goBackBtn) goBackBtn.style.display = "none";
    if (toggleDetailsBtn) toggleDetailsBtn.style.display = "none";
    if (reAnalyzeBtn) reAnalyzeBtn.style.display = "none";
  }

  function showAnalyzing() {
    hideAllStates();
    if (stateAnalyzing) stateAnalyzing.style.display = "flex";
    pillEl.className = "protection-pill pill-protected";
    pillTextEl.textContent = "Scanning";
    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-checking";
      siteRiskTagEl.textContent = "SCANNING";
    }
  }

  function showSafe(incident) {
    hideAllStates();
    if (stateSafe) stateSafe.style.display = "flex";
    pillEl.className = "protection-pill pill-protected";
    pillTextEl.textContent = "Protected";
    if (reAnalyzeBtn) reAnalyzeBtn.style.display = "block";
    if (toggleDetailsBtn) toggleDetailsBtn.style.display = "block";
    if (investigateBtn) {
      investigateBtn.style.display = "block";
      setupInvestigateLink(incident);
    }
    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-safe";
      siteRiskTagEl.textContent = "SAFE";
    }
  }

  function showSuspicious(incident) {
    hideAllStates();
    if (stateSuspicious) stateSuspicious.style.display = "flex";
    pillEl.className = "protection-pill pill-warning";
    pillTextEl.textContent = "Warning";
    if (reAnalyzeBtn) reAnalyzeBtn.style.display = "block";
    if (investigateBtn) {
      investigateBtn.style.display = "block";
      setupInvestigateLink(incident);
    }
    if (toggleDetailsBtn) toggleDetailsBtn.style.display = "block";
    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-suspicious";
      siteRiskTagEl.textContent = "SUSPICIOUS";
    }
  }

  function showDanger(incident, isCritical) {
    hideAllStates();
    if (stateDanger) stateDanger.style.display = "flex";
    pillEl.className = "protection-pill pill-danger";
    pillTextEl.textContent = isCritical ? "Critical" : "High Risk";

    if (dangerHeadline) {
      dangerHeadline.textContent = isCritical ? "CRITICAL RISK DETECTED" : "HIGH RISK DETECTED";
    }
    if (dangerSubline) {
      dangerSubline.textContent = isCritical
        ? "Confirmed malicious website or active exploit"
        : "Potential phishing or deceptive page";
    }
    if (dangerWarningMsg) {
      dangerWarningMsg.textContent = isCritical
        ? "ORION detected critical deceptive indicators. Do NOT enter credentials or download any files."
        : "ORION detected high-risk signals associated with credential harvesting. Exercise strict caution.";
    }

    // Populate Threat Flags
    if (dangerFlagsList) {
      dangerFlagsList.innerHTML = "";
      const flags = [];
      if (incident && incident.risk_drivers && incident.risk_drivers.length > 0) {
        incident.risk_drivers.forEach((d) => flags.push(d));
      } else if (incident && incident.evidence && incident.evidence.length > 0) {
        incident.evidence.slice(0, 3).forEach((e) => flags.push(e.explanation || e.type));
      } else {
        flags.push("Domain reputation anomaly", "Suspicious form destination");
      }

      flags.slice(0, 3).forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        dangerFlagsList.appendChild(li);
      });
    }

    if (investigateBtn) {
      investigateBtn.style.display = "block";
      setupInvestigateLink(incident);
    }
    if (goBackBtn) goBackBtn.style.display = "block";
    if (reAnalyzeBtn) reAnalyzeBtn.style.display = "block";
    if (toggleDetailsBtn) toggleDetailsBtn.style.display = "block";

    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-danger";
      siteRiskTagEl.textContent = isCritical ? "CRITICAL" : "HIGH RISK";
    }
  }

  function showInconclusive(incident) {
    hideAllStates();
    if (stateInconclusive) stateInconclusive.style.display = "flex";
    pillEl.className = "protection-pill pill-offline";
    pillTextEl.textContent = "Inconclusive";
    if (reAnalyzeBtn) reAnalyzeBtn.style.display = "block";
    if (toggleDetailsBtn) toggleDetailsBtn.style.display = "block";
    if (investigateBtn) {
      investigateBtn.style.display = "block";
      setupInvestigateLink(incident);
    }
    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-inconclusive";
      siteRiskTagEl.textContent = "INCONCLUSIVE";
    }
  }

  function showUnavailable(msg) {
    hideAllStates();
    if (stateUnavailable) stateUnavailable.style.display = "flex";
    pillEl.className = "protection-pill pill-offline";
    pillTextEl.textContent = "Unavailable";
    const descEl = stateUnavailable ? stateUnavailable.querySelector(".offline-note") : null;
    if (descEl && msg) descEl.textContent = msg;
    if (siteRiskTagEl) {
      siteRiskTagEl.style.display = "inline-block";
      siteRiskTagEl.className = "site-risk-tag tag-offline";
      siteRiskTagEl.textContent = "OFFLINE";
    }
  }

  function setupInvestigateLink(incident) {
    if (!investigateBtn) return;
    if (incident && incident.id) {
      investigateBtn.href = `${FRONTEND_URL}/?tab=incidents&id=${encodeURIComponent(incident.id)}`;
    } else if (incident && incident.url) {
      investigateBtn.href = `${FRONTEND_URL}/check?tab=link&url=${encodeURIComponent(incident.url)}`;
    } else {
      investigateBtn.href = `${FRONTEND_URL}/app/checks`;
    }
  }

  function renderIncident(incident) {
    currentIncident = incident;
    const level = (incident.risk_level || "SAFE").toUpperCase();

    // Populate Details View
    if (riskScoreDisplay) {
      const scoreVal = (incident.risk_score || 0).toFixed(2);
      riskScoreDisplay.textContent = `Score: ${scoreVal}`;
    }
    if (detailThreatType) {
      detailThreatType.textContent = (incident.threat_type || "None").replace(/_/g, " ").toUpperCase();
    }

    if (detailEvidenceList) {
      detailEvidenceList.innerHTML = "";
      const evidence = incident.evidence || [];
      if (evidence.length === 0) {
        detailEvidenceList.innerHTML =
          '<li style="color: #64748b; font-style: italic;">No specific threat evidence flagged.</li>';
      } else {
        evidence.slice(0, 4).forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item.explanation || item.type;
          detailEvidenceList.appendChild(li);
        });
      }
    }

    // Route to appropriate view
    if (level === "CRITICAL") {
      showDanger(incident, true);
    } else if (level === "HIGH") {
      showDanger(incident, false);
    } else if (level === "MEDIUM" || level === "SUSPICIOUS") {
      showSuspicious(incident);
    } else if (level === "INCONCLUSIVE") {
      showInconclusive(incident);
    } else if (level === "UNAVAILABLE" || level === "ERROR" || level === "OFFLINE") {
      showUnavailable(incident.explanation || "Backend service offline or unreachable.");
    } else {
      showSafe(incident);
    }
  }

  // Initialization logic
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];

    if (!currentTab || !currentTab.url) {
      showUnavailable("Unable to access current browser tab.");
      return;
    }

    // Handle non-web pages (chrome://, file://, about:)
    if (!currentTab.url.startsWith("http://") && !currentTab.url.startsWith("https://")) {
      hostnameEl.textContent = "Internal Browser Page";
      if (pillEl) {
        pillEl.className = "protection-pill pill-protected";
        pillTextEl.textContent = "Isolated";
      }
      showSafe({
        risk_level: "SAFE",
        explanation: "Internal browser page is isolated by local sandbox.",
      });
      return;
    }

    const parsedUrl = new URL(currentTab.url);
    hostnameEl.textContent = parsedUrl.hostname;
    if (currentTab.title && currentTab.title !== parsedUrl.hostname) {
      pageTitleEl.textContent = currentTab.title;
      pageTitleEl.style.display = "block";
    }

    // Check if tab already has completed analysis in storage
    const tabKey = `tab_${currentTab.id}`;
    const storageData = await chrome.storage.local.get([tabKey]);
    const cachedIncident = storageData[tabKey];

    if (cachedIncident && cachedIncident.risk_level) {
      renderIncident(cachedIncident);
    } else {
      // Auto analyze immediately if not already completed!
      showAnalyzing();
      triggerPageAnalysis();
    }
  } catch (err) {
    console.error("ORION Shield Popup Init Error:", err);
    showUnavailable("Failed to initialize security assessment.");
  }
});
