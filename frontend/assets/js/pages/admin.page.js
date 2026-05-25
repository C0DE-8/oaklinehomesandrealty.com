(function () {
  const page = document.body.dataset.adminPage || "auth";
  const api = window.OaklineAdminApi;
  const status = document.getElementById("admin-status");
  const dashboardStatus = document.getElementById("dashboard-status");
  const logoutButton = document.getElementById("admin-logout");
  let listings = [];
  let agents = [];

  function setStatus(element, message, type) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function formData(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    Object.keys(data).forEach((key) => {
      if (data[key] === "") {
        delete data[key];
      }
    });
    return data;
  }

  function redirectToLogin() {
    window.location.href = "admin/index.html";
  }

  function redirectToDashboard() {
    window.location.href = "admin/dashboard.html";
  }

  async function requireAdmin() {
    if (!api.getToken()) {
      redirectToLogin();
      return null;
    }

    try {
      const data = await api.me();
      const admin = data.admin;
      const title = document.getElementById("dashboard-title");
      const emailLabel = document.getElementById("admin-email-label");

      if (title && admin.name) {
        title.textContent = `Welcome, ${admin.name}`;
      }

      if (emailLabel) {
        emailLabel.textContent = admin.email || "";
      }

      return admin;
    } catch (error) {
      api.clearToken();
      redirectToLogin();
      return null;
    }
  }

  function wireLogout() {
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener("click", () => {
      api.clearToken();
      redirectToLogin();
    });
  }

  function setMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value || 0;
    }
  }

  function renderListings() {
    const list = document.getElementById("admin-listings-list");
    if (!list) {
      return;
    }

    if (!listings.length) {
      list.innerHTML = '<p class="admin-status">No listings yet.</p>';
      return;
    }

    list.innerHTML = listings
      .map(
        (listing) => `
          <div class="admin-list-item">
            <div>
              <strong>${listing.title}</strong>
              <span>${listing.city || ""}, ${listing.state || ""} - ${listing.status} - $${Number(listing.price || 0).toLocaleString()}</span>
            </div>
            <div class="admin-list-actions">
              <button class="admin-mini-button" type="button" data-edit-listing="${listing.id}">Edit</button>
              <button class="admin-mini-button danger" type="button" data-delete-listing="${listing.id}">Delete</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderAgents() {
    const list = document.getElementById("admin-agents-list");
    if (!list) {
      return;
    }

    if (!agents.length) {
      list.innerHTML = '<p class="admin-status">No agents yet.</p>';
      return;
    }

    list.innerHTML = agents
      .map(
        (agent) => `
          <div class="admin-list-item">
            <div>
              <strong>${agent.name}</strong>
              <span>${agent.email} - ${agent.market || "United States"} - ${agent.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div class="admin-list-actions">
              <button class="admin-mini-button" type="button" data-edit-agent="${agent.id}">Edit</button>
              <button class="admin-mini-button danger" type="button" data-delete-agent="${agent.id}">Delete</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  async function initAuth() {
    if (api.getToken()) {
      redirectToDashboard();
      return;
    }

    const loginForm = document.getElementById("admin-login-form");
    const registerForm = document.getElementById("admin-register-form");
    const tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const mode = tab.dataset.adminTab;
        tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
        loginForm.classList.toggle("is-hidden", mode !== "login");
        registerForm.classList.toggle("is-hidden", mode !== "register");
        setStatus(status, "", "");
      });
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(status, "Logging in...", "");

      try {
        const data = await api.login(formData(loginForm));
        api.setToken(data.token);
        redirectToDashboard();
      } catch (error) {
        setStatus(status, error.message, "error");
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(status, "Creating admin...", "");

      try {
        const data = await api.register(formData(registerForm));
        api.setToken(data.token);
        redirectToDashboard();
      } catch (error) {
        setStatus(status, error.message, "error");
      }
    });
  }

  async function initDashboard() {
    const admin = await requireAdmin();
    if (!admin) {
      return;
    }

    try {
      const data = await api.listingStats();
      const stats = data.stats || {};
      setMetric("metric-active-listings", stats.activeListings);
      setMetric("metric-new-leads", stats.newLeads);
      setMetric("metric-saved-users", stats.savedUsers);
      setStatus(dashboardStatus, admin.email || "", "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  }

  function fillListingForm(listing) {
    document.getElementById("listing-id").value = listing.id || "";
    document.getElementById("listing-title").value = listing.title || "";
    document.getElementById("listing-code").value = listing.listing_code || "";
    document.getElementById("listing-status").value = listing.status || "draft";
    document.getElementById("listing-type").value = listing.property_type || "apartment";
    document.getElementById("listing-address").value = listing.address_line_1 || "";
    document.getElementById("listing-city").value = listing.city || "";
    document.getElementById("listing-state").value = listing.state || "";
    document.getElementById("listing-price").value = listing.price || "";
    document.getElementById("listing-bedrooms").value = listing.bedrooms || "";
    document.getElementById("listing-bathrooms").value = listing.bathrooms || "";
    document.getElementById("listing-square-feet").value = listing.square_feet || "";
    document.getElementById("listing-cover").value = listing.cover_image_url || "";
    document.getElementById("listing-description").value = listing.description || "";
  }

  async function loadListings() {
    const data = await api.listListings();
    listings = data.listings || [];
    renderListings();
  }

  async function initListings() {
    if (!(await requireAdmin())) {
      return;
    }

    const form = document.getElementById("admin-listing-form");
    const list = document.getElementById("admin-listings-list");
    await loadListings();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      setStatus(dashboardStatus, id ? "Updating listing..." : "Creating listing...", "");

      try {
        if (id) {
          await api.updateListing(id, data);
        } else {
          await api.createListing(data);
        }
        form.reset();
        await loadListings();
        setStatus(dashboardStatus, "Listing saved.", "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });

    list.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editListing;
      const deleteId = event.target.dataset.deleteListing;

      if (editId) {
        fillListingForm(listings.find((item) => String(item.id) === String(editId)) || {});
      }

      if (deleteId && window.confirm("Delete this listing?")) {
        await api.deleteListing(deleteId);
        await loadListings();
        setStatus(dashboardStatus, "Listing deleted.", "success");
      }
    });

    document.getElementById("listing-form-reset").addEventListener("click", () => form.reset());
  }

  function fillAgentForm(agent) {
    document.getElementById("agent-id").value = agent.id || "";
    document.getElementById("agent-name").value = agent.name || "";
    document.getElementById("agent-email").value = agent.email || "";
    document.getElementById("agent-phone").value = agent.phone || "";
    document.getElementById("agent-market").value = agent.market || "";
    document.getElementById("agent-title").value = agent.title || "";
    document.getElementById("agent-photo").value = agent.photo_url || "";
    document.getElementById("agent-bio").value = agent.bio || "";
  }

  async function loadAgents() {
    const data = await api.listAgents();
    agents = data.agents || [];
    renderAgents();
  }

  async function initAgents() {
    if (!(await requireAdmin())) {
      return;
    }

    const form = document.getElementById("admin-agent-form");
    const list = document.getElementById("admin-agents-list");
    await loadAgents();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      setStatus(dashboardStatus, id ? "Updating agent..." : "Creating agent...", "");

      try {
        if (id) {
          await api.updateAgent(id, data);
        } else {
          await api.createAgent(data);
        }
        form.reset();
        await loadAgents();
        setStatus(dashboardStatus, "Agent saved.", "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });

    list.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editAgent;
      const deleteId = event.target.dataset.deleteAgent;

      if (editId) {
        fillAgentForm(agents.find((item) => String(item.id) === String(editId)) || {});
      }

      if (deleteId && window.confirm("Delete this agent?")) {
        await api.deleteAgent(deleteId);
        await loadAgents();
        setStatus(dashboardStatus, "Agent deleted.", "success");
      }
    });

    document.getElementById("agent-form-reset").addEventListener("click", () => form.reset());
  }

  async function initAccount() {
    const admin = await requireAdmin();
    if (!admin) {
      return;
    }

    const profileForm = document.getElementById("admin-profile-form");
    const passwordForm = document.getElementById("admin-password-form");
    document.getElementById("profile-name").value = admin.name || "";
    document.getElementById("profile-phone").value = admin.phone || "";

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(dashboardStatus, "Saving profile...", "");

      try {
        await api.updateProfile(formData(profileForm));
        setStatus(dashboardStatus, "Profile saved.", "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });

    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(dashboardStatus, "Updating password...", "");

      try {
        const data = await api.updatePassword(formData(passwordForm));
        passwordForm.reset();
        setStatus(dashboardStatus, data.message, "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });
  }

  wireLogout();

  if (page === "auth") {
    initAuth();
  } else if (page === "dashboard") {
    initDashboard();
  } else if (page === "listings") {
    initListings();
  } else if (page === "agents") {
    initAgents();
  } else if (page === "account") {
    initAccount();
  }
})();
