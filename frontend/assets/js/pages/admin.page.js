(function () {
  const body = document.body;
  const status = document.getElementById("admin-status");
  const dashboardStatus = document.getElementById("dashboard-status");
  const dashboardTitle = document.getElementById("dashboard-title");
  const loginForm = document.getElementById("admin-login-form");
  const registerForm = document.getElementById("admin-register-form");
  const profileForm = document.getElementById("admin-profile-form");
  const passwordForm = document.getElementById("admin-password-form");
  const listingForm = document.getElementById("admin-listing-form");
  const agentForm = document.getElementById("admin-agent-form");
  const logoutButton = document.getElementById("admin-logout");
  const profileName = document.getElementById("profile-name");
  const profilePhone = document.getElementById("profile-phone");
  const listingsList = document.getElementById("admin-listings-list");
  const agentsList = document.getElementById("admin-agents-list");
  const authTabs = Array.from(document.querySelectorAll("[data-admin-tab]"));
  const dashboardTabs = Array.from(document.querySelectorAll("[data-dashboard-view]"));
  const dashboardPanels = Array.from(document.querySelectorAll("[data-dashboard-panel]"));

  let listings = [];
  let agents = [];

  function setStatus(element, message, type) {
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

  function setMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value || 0;
    }
  }

  function switchDashboardView(view) {
    dashboardTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.dashboardView === view);
    });
    dashboardPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.dashboardPanel === view);
    });
  }

  function showDashboard(admin) {
    body.classList.add("is-authenticated");
    dashboardTitle.textContent = admin && admin.name ? `Welcome, ${admin.name}` : "Dashboard";
    profileName.value = admin && admin.name ? admin.name : "";
    profilePhone.value = admin && admin.phone ? admin.phone : "";
    setStatus(dashboardStatus, admin && admin.email ? admin.email : "", "success");
    loadDashboardData();
  }

  function showAuth(message) {
    body.classList.remove("is-authenticated");
    if (message) {
      setStatus(status, message, "error");
    }
  }

  function renderListings() {
    if (!listings.length) {
      listingsList.innerHTML = "<p class=\"admin-status\">No listings yet.</p>";
      return;
    }

    listingsList.innerHTML = listings
      .map(
        (listing) => `
          <div class="admin-list-item">
            <div>
              <strong>${listing.title}</strong>
              <span>${listing.city || ""}, ${listing.state || ""} · ${listing.status} · $${Number(listing.price || 0).toLocaleString()}</span>
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
    if (!agents.length) {
      agentsList.innerHTML = "<p class=\"admin-status\">No agents yet.</p>";
      return;
    }

    agentsList.innerHTML = agents
      .map(
        (agent) => `
          <div class="admin-list-item">
            <div>
              <strong>${agent.name}</strong>
              <span>${agent.email} · ${agent.market || "United States"} · ${agent.is_active ? "Active" : "Inactive"}</span>
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

  async function loadDashboardData() {
    try {
      const [statsData, listingsData, agentsData] = await Promise.all([
        window.OaklineAdminApi.listingStats(),
        window.OaklineAdminApi.listListings(),
        window.OaklineAdminApi.listAgents(),
      ]);

      const stats = statsData.stats || {};
      listings = listingsData.listings || [];
      agents = agentsData.agents || [];

      setMetric("metric-active-listings", stats.activeListings);
      setMetric("metric-new-leads", stats.newLeads);
      setMetric("metric-saved-users", stats.savedUsers);
      renderListings();
      renderAgents();
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  }

  async function loadCurrentAdmin() {
    if (!window.OaklineAdminApi.getToken()) {
      return;
    }

    try {
      const data = await window.OaklineAdminApi.me();
      showDashboard(data.admin);
    } catch (error) {
      window.OaklineAdminApi.clearToken();
      showAuth("Please login again.");
    }
  }

  function fillListingForm(listing) {
    listingForm.reset();
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

  function fillAgentForm(agent) {
    agentForm.reset();
    document.getElementById("agent-id").value = agent.id || "";
    document.getElementById("agent-name").value = agent.name || "";
    document.getElementById("agent-email").value = agent.email || "";
    document.getElementById("agent-phone").value = agent.phone || "";
    document.getElementById("agent-market").value = agent.market || "";
    document.getElementById("agent-title").value = agent.title || "";
    document.getElementById("agent-photo").value = agent.photo_url || "";
    document.getElementById("agent-bio").value = agent.bio || "";
  }

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.adminTab;
      authTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      loginForm.classList.toggle("is-hidden", mode !== "login");
      registerForm.classList.toggle("is-hidden", mode !== "register");
      setStatus(status, "", "");
    });
  });

  dashboardTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchDashboardView(tab.dataset.dashboardView));
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Logging in...", "");

    try {
      const data = await window.OaklineAdminApi.login(formData(loginForm));
      window.OaklineAdminApi.setToken(data.token);
      loginForm.reset();
      showDashboard(data.admin);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Creating admin...", "");

    try {
      const data = await window.OaklineAdminApi.register(formData(registerForm));
      window.OaklineAdminApi.setToken(data.token);
      registerForm.reset();
      showDashboard(data.admin);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(dashboardStatus, "Saving profile...", "");

    try {
      const data = await window.OaklineAdminApi.updateProfile(formData(profileForm));
      showDashboard(data.admin);
      setStatus(dashboardStatus, "Profile saved.", "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(dashboardStatus, "Updating password...", "");

    try {
      const data = await window.OaklineAdminApi.updatePassword(formData(passwordForm));
      passwordForm.reset();
      setStatus(dashboardStatus, data.message, "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  listingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(listingForm);
    const id = data.id;
    delete data.id;
    setStatus(dashboardStatus, id ? "Updating listing..." : "Creating listing...", "");

    try {
      if (id) {
        await window.OaklineAdminApi.updateListing(id, data);
      } else {
        await window.OaklineAdminApi.createListing(data);
      }
      listingForm.reset();
      await loadDashboardData();
      setStatus(dashboardStatus, "Listing saved.", "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  agentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(agentForm);
    const id = data.id;
    delete data.id;
    setStatus(dashboardStatus, id ? "Updating agent..." : "Creating agent...", "");

    try {
      if (id) {
        await window.OaklineAdminApi.updateAgent(id, data);
      } else {
        await window.OaklineAdminApi.createAgent(data);
      }
      agentForm.reset();
      await loadDashboardData();
      setStatus(dashboardStatus, "Agent saved.", "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  listingsList.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editListing;
    const deleteId = event.target.dataset.deleteListing;

    if (editId) {
      const listing = listings.find((item) => String(item.id) === String(editId));
      fillListingForm(listing || {});
    }

    if (deleteId && window.confirm("Delete this listing?")) {
      await window.OaklineAdminApi.deleteListing(deleteId);
      await loadDashboardData();
      setStatus(dashboardStatus, "Listing deleted.", "success");
    }
  });

  agentsList.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editAgent;
    const deleteId = event.target.dataset.deleteAgent;

    if (editId) {
      const agent = agents.find((item) => String(item.id) === String(editId));
      fillAgentForm(agent || {});
    }

    if (deleteId && window.confirm("Delete this agent?")) {
      await window.OaklineAdminApi.deleteAgent(deleteId);
      await loadDashboardData();
      setStatus(dashboardStatus, "Agent deleted.", "success");
    }
  });

  document.getElementById("listing-form-reset").addEventListener("click", () => listingForm.reset());
  document.getElementById("agent-form-reset").addEventListener("click", () => agentForm.reset());

  logoutButton.addEventListener("click", () => {
    window.OaklineAdminApi.clearToken();
    showAuth("");
    setStatus(status, "Logged out.", "success");
  });

  loadCurrentAdmin();
})();
