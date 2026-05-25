(function () {
  const api = window.OaklinePublicApi;
  const fallbackAgentImage = "assets/images/branding/icon.png";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function apiOrigin() {
    try {
      const url = new URL(api.apiBaseURL);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      return "";
    }
  }

  function assetUrl(value, fallback) {
    if (!value) {
      return fallback;
    }

    if (/^https?:\/\//i.test(value) || value.startsWith("assets/")) {
      return value;
    }

    if (value.startsWith("/uploads/")) {
      return `${apiOrigin()}${value}`;
    }

    return value.replace(/^\/+/, "");
  }

  function agentHref(agent) {
    return `agents/info.html?id=${encodeURIComponent(agent.id)}`;
  }

  function renderAgentCard(agent) {
    return `
      <a href="${escapeHtml(agentHref(agent))}" class="agent-card">
        <img src="${escapeHtml(assetUrl(agent.photo_url, fallbackAgentImage))}" alt="${escapeHtml(agent.name || "Agent")}" />
        <div class="agent-card-body">
          <h2>${escapeHtml(agent.name || "Oakline Agent")}</h2>
          <p>${escapeHtml(agent.bio || agent.title || agent.market || "Real estate support for your next move.")}</p>
          <span>View Profile</span>
        </div>
      </a>
    `;
  }

  function setStatus(message) {
    const list = document.querySelector(".agents-grid");

    if (list) {
      list.innerHTML = `<p class="agents-status">${escapeHtml(message)}</p>`;
    }
  }

  async function loadAgents() {
    const list = document.querySelector(".agents-grid");

    if (!api || !list) {
      return;
    }

    setStatus("Loading agents...");

    try {
      const data = await api.listAgents();
      const agents = data.agents || [];
      list.innerHTML = agents.length ? agents.map(renderAgentCard).join("") : "";

      if (!agents.length) {
        setStatus("No active agents yet.");
      }
    } catch (error) {
      console.error("Unable to load agents", error);
      setStatus("Agents could not load from the API.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadAgents);
})();
