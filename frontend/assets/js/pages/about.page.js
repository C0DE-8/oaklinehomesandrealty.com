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

  function renderAgentCard(agent) {
    const name = agent.name || "Oakline Agent";

    return `
      <div role="listitem" class="w-dyn-item">
        <a href="agents/info.html?id=${encodeURIComponent(agent.id)}" class="agent-wrapper w-inline-block">
          <div class="agent-image">
            <img loading="lazy" alt="${escapeHtml(name)}" src="${escapeHtml(
              assetUrl(agent.photo_url, fallbackAgentImage)
            )}" sizes="100vw" class="image-full" />
          </div>
          <div class="agent-content">
            <h5 class="h5-title">${escapeHtml(name)}</h5>
            <p>${escapeHtml(agent.title || agent.market || "Agent")}</p>
          </div>
        </a>
      </div>
    `;
  }

  function setStatus(message) {
    const list = document.querySelector(".agent-collection");

    if (list) {
      list.innerHTML = `<p class="agents-status">${escapeHtml(message)}</p>`;
    }
  }

  async function loadAgents() {
    const list = document.querySelector(".agent-collection");

    if (!api || !list) {
      return;
    }

    try {
      const data = await api.listAgents();
      const agents = data.agents || [];
      list.innerHTML = agents.length ? agents.slice(0, 3).map(renderAgentCard).join("") : "";

      if (!agents.length) {
        setStatus("No active agents yet.");
      }
    } catch (error) {
      console.error("Unable to load about page agents", error);
      setStatus("Agents could not load from the API.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadAgents);
})();
