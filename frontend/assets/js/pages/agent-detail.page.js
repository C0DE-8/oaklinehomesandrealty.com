(function () {
  const api = window.OaklinePublicApi;
  const fallbackAgentImage = "../assets/images/branding/icon.png";
  let currentAgent = null;

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

    if (/^https?:\/\//i.test(value) || value.startsWith("../assets/")) {
      return value;
    }

    if (value.startsWith("assets/")) {
      return `../${value}`;
    }

    if (value.startsWith("/uploads/")) {
      return `${apiOrigin()}${value}`;
    }

    return `../${value.replace(/^\/+/, "")}`;
  }

  function agentId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value || "";
    }
  }

  function setInputValue(selector, value) {
    const input = document.querySelector(selector);

    if (input) {
      input.value = value == null ? "" : value;
    }
  }

  function setMeta(selector, value) {
    document.querySelectorAll(selector).forEach((meta) => {
      meta.setAttribute("content", value || "");
    });
  }

  function renderAgent(agent) {
    const image = assetUrl(agent.photo_url, fallbackAgentImage);
    const description = agent.bio || `${agent.name} can help you compare listings and plan your next move.`;
    const detailValues = document.querySelectorAll(".agent-detail .detail");

    currentAgent = agent;
    document.title = `${agent.name} - Oakline Homes and Realty`;
    setMeta('meta[name="description"], meta[property="og:description"], meta[property="twitter:description"]', description);
    setMeta('meta[property="og:image"], meta[property="twitter:image"]', image);
    setText(".nav-agent-name", agent.name);
    setText(".agent-detail h5", agent.name);
    setText(".agent-detail .title-large", agent.title || "Agent");
    setText(".agent-detail .w-richtext", description);
    setText(".agent-detail .paragraph-small.w-dyn-bind-empty", agent.market || "");

    document.querySelectorAll(".nav-agent-brand .avatar-image, .agent-detail .avatar-large .avatar-image").forEach((img) => {
      img.src = image;
      img.alt = agent.name || "Agent";
    });

    if (detailValues[0]) {
      detailValues[0].textContent = agent.phone || "Contact by form";
    }

    if (detailValues[1]) {
      detailValues[1].textContent = agent.email || "";
    }

    if (detailValues[2]) {
      detailValues[2].textContent = agent.market || "United States";
    }

    setInputValue('input[name="agent-id"]', agent.id);
    setInputValue('input[name="agent-name"]', agent.name);
  }

  function serializeLeadForm(form) {
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.pageUrl = window.location.href;

    if (currentAgent) {
      data.assignedAgentId = currentAgent.id;
      data.agentName = currentAgent.name;
      data.market = data.market || currentAgent.market;
    }

    return data;
  }

  function showLeadFormState(form, succeeded, message) {
    const container = form.closest(".w-form") || document;
    const success = container.querySelector(".w-form-done");
    const fail = container.querySelector(".w-form-fail");
    const failText = fail && fail.querySelector("div");

    if (success) {
      success.style.display = succeeded ? "block" : "none";
    }

    if (fail) {
      fail.style.display = succeeded ? "none" : "block";
    }

    if (failText && message) {
      failText.textContent = message;
    }

    form.style.display = succeeded ? "none" : "";
  }

  function initLeadForm() {
    const form = document.querySelector(".fancy-form");

    if (!form || form.dataset.oaklineLeadForm === "true") {
      return;
    }

    form.dataset.oaklineLeadForm = "true";
    form.setAttribute("action", "#");

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const submit = form.querySelector('[type="submit"]');
        const originalValue = submit && submit.value;

        if (submit) {
          submit.disabled = true;
          submit.value = submit.getAttribute("data-wait") || "Working...";
        }

        try {
          const response = await api.createLead(serializeLeadForm(form));
          const successTitle = document.querySelector(".fancy-form-success-title");

          if (successTitle && response.message) {
            successTitle.textContent = response.message;
          }

          showLeadFormState(form, true);
        } catch (error) {
          showLeadFormState(form, false, error.message || "Unable to submit this lead.");
        } finally {
          if (submit) {
            submit.disabled = false;
            submit.value = originalValue || "Submit";
          }
        }
      },
      true
    );
  }

  async function loadAgent() {
    const id = agentId();

    if (!api || !id) {
      setText(".agent-detail h5", "Agent not found");
      return;
    }

    try {
      const data = await api.getAgent(id);
      renderAgent(data.agent);
    } catch (error) {
      console.error("Unable to load agent", error);
      setText(".agent-detail h5", "Agent not found");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLeadForm();
    loadAgent();
  });
})();
