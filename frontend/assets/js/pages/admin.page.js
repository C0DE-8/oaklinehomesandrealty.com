(function () {
  const page = document.body.dataset.adminPage || "auth";
  const api = window.OaklineAdminApi;
  const status = document.getElementById("admin-status");
  const dashboardStatus = document.getElementById("dashboard-status");
  const logoutButton = document.getElementById("admin-logout");
  const stateAbbreviations = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    newhampshire: "NH",
    newjersey: "NJ",
    newmexico: "NM",
    newyork: "NY",
    northcarolina: "NC",
    northdakota: "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    rhodeisland: "RI",
    southcarolina: "SC",
    southdakota: "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    westvirginia: "WV",
    wisconsin: "WI",
    wyoming: "WY",
  };
  let listings = [];
  let agents = [];
  let leads = [];

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

  function listingFormData(form) {
    const data = new FormData(form);

    Array.from(data.entries()).forEach(([key, value]) => {
      if (value === "" || (typeof File !== "undefined" && value instanceof File && !value.name)) {
        data.delete(key);
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

  function normalizeState(value) {
    const state = String(value || "").trim();

    if (state.length === 2) {
      return state.toUpperCase();
    }

    return stateAbbreviations[state.toLowerCase().replace(/[^a-z]/g, "")] || state;
  }

  function absoluteApiUrl(value) {
    const url = String(value || "");

    if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
      return url;
    }

    return `${api.baseURL.replace(/\/api$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
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
      sessionStorage.setItem("oakline_skip_user_admin_exchange", "1");
      redirectToLogin();
    });
  }

  function setMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value || 0;
    }
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
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
      .map((listing) => {
        const location = [listing.address_line_1, listing.address_line_2, listing.city, listing.state, listing.postal_code]
          .filter(Boolean)
          .join(", ");
        const features = (listing.features || []).slice(0, 4);

        return `
          <div class="admin-list-item">
            <div>
              <strong>${listing.title}</strong>
              <span>${location || "United States"} - ${listing.status} - $${Number(listing.price || 0).toLocaleString()}</span>
              ${
                features.length
                  ? `<div class="admin-feature-list">${features
                      .map((feature) => `<span>${feature.feature_name}</span>`)
                      .join("")}</div>`
                  : ""
              }
            </div>
            <div class="admin-list-actions">
              <button class="admin-mini-button" type="button" data-edit-listing="${listing.id}">Edit</button>
              <button class="admin-mini-button danger" type="button" data-delete-listing="${listing.id}">Delete</button>
            </div>
          </div>
        `;
      })
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
              ${
                agent.photo_url
                  ? `<div class="admin-feature-list"><span>Photo uploaded</span></div>`
                  : ""
              }
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

  function renderLeads() {
    const list = document.getElementById("admin-leads-list");
    if (!list) {
      return;
    }

    if (!leads.length) {
      list.innerHTML = '<p class="admin-status">No Get Started submissions yet.</p>';
      return;
    }

    list.innerHTML = leads
      .map((lead) => {
        const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
        const source = lead.source ? ` - ${lead.source}` : "";
        const propertyName =
          lead.property_listing_code || lead.property_title
            ? [lead.property_listing_code ? `#OaklineHomes${lead.property_listing_code}` : lead.property_title, [lead.property_city, lead.property_state].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(" - ")
            : "";
        const leadDetails = [
          ["Property", propertyName],
          ["Market", lead.market],
          ["Bedrooms", lead.bedrooms],
          ["Extra room", lead.extra_room ? "Yes" : "No"],
          ["Bathrooms", lead.bathrooms],
          ["Max budget", lead.max_budget ? `$${Number(lead.max_budget).toLocaleString()}` : ""],
          ["Move date", lead.move_date ? String(lead.move_date).slice(0, 10) : ""],
          ["Lease term", lead.lease_term],
          ["Credit", lead.credit],
          ["Background", lead.background],
          ["Instagram", lead.instagram],
          ["Referral", lead.referral],
          ["Feature requests", lead.feature_requests],
        ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

        return `
          <div class="admin-list-item admin-lead-item">
            <div>
              <strong>${escapeHtml(name || "New lead")}</strong>
              <span>${escapeHtml(lead.email || "")} - ${escapeHtml(lead.phone || "No phone")}${escapeHtml(source)}</span>
              <span>${escapeHtml(formatDate(lead.created_at))}</span>
              <dl class="admin-lead-details">
                ${leadDetails
                  .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
                  .join("")}
              </dl>
            </div>
            <div class="admin-list-actions admin-lead-actions">
              <select data-lead-agent="${lead.id}">
                <option value="">No agent assigned</option>
                ${agents
                  .map(
                    (agent) =>
                      `<option value="${agent.id}"${String(lead.assigned_agent_id || "") === String(agent.id) ? " selected" : ""}>${escapeHtml(agent.name)}</option>`
                  )
                  .join("")}
              </select>
              <select data-lead-status="${lead.id}">
                ${["new", "contacted", "qualified", "closed", "lost"]
                  .map((statusName) => `<option value="${statusName}"${lead.status === statusName ? " selected" : ""}>${statusName}</option>`)
                  .join("")}
              </select>
              <button class="admin-mini-button" type="button" data-save-lead="${lead.id}">Save</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async function initAuth() {
    if (api.getToken()) {
      redirectToDashboard();
      return;
    }

    const skipUserExchange = sessionStorage.getItem("oakline_skip_user_admin_exchange") === "1";
    sessionStorage.removeItem("oakline_skip_user_admin_exchange");

    if (!skipUserExchange && api.getUserToken && api.getUserToken()) {
      setStatus(status, "Checking signed-in user access...", "");

      try {
        const data = await api.loginFromUserSession();
        api.setToken(data.token);
        redirectToDashboard();
        return;
      } catch (error) {
        setStatus(status, "Signed-in user could not be used for admin access. Log in with an admin account.", "error");
      }
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
    document.getElementById("listing-country").value = listing.country || "United States";
    document.getElementById("listing-title").value = listing.title || "";
    document.getElementById("listing-code").value = listing.listing_code || "";
    document.getElementById("listing-status").value = listing.status || "draft";
    document.getElementById("listing-type").value = listing.property_type || "apartment";
    document.getElementById("listing-address").value = listing.address_line_1 || "";
    document.getElementById("listing-address-2").value = listing.address_line_2 || "";
    document.getElementById("listing-city").value = listing.city || "";
    document.getElementById("listing-state").value = normalizeState(listing.state);
    document.getElementById("listing-postal-code").value = listing.postal_code || "";
    document.getElementById("listing-price").value = listing.price || "";
    document.getElementById("listing-bedrooms").value = listing.bedrooms || "";
    document.getElementById("listing-bathrooms").value = listing.bathrooms || "";
    document.getElementById("listing-square-feet").value = listing.square_feet || "";
    document.getElementById("listing-features").value = (listing.features || [])
      .map((feature) => feature.feature_name)
      .join("\n");
    document.getElementById("listing-cover").value = "";
    document.getElementById("listing-cover-url").value = listing.cover_image_url || "";
    renderCoverPreview(listing.cover_image_url);
    renderGalleryPreview(listing.id, listing.images || []);
    document.getElementById("listing-description").value = listing.description || "";
    syncListingMarket();
  }

  function renderCoverPreview(imageUrl) {
    const preview = document.getElementById("listing-cover-preview");

    if (!preview) {
      return;
    }

    preview.innerHTML = imageUrl
      ? `<div class="admin-image-thumb"><img src="${absoluteApiUrl(imageUrl)}" alt="Current cover image"></div>`
      : "";
  }

  function renderGalleryPreview(listingId, images) {
    const preview = document.getElementById("listing-gallery-preview");

    if (!preview) {
      return;
    }

    preview.innerHTML = (images || [])
      .map(
        (image) => `
          <div class="admin-image-thumb">
            <img src="${absoluteApiUrl(image.image_url)}" alt="${image.alt_text || "Listing image"}">
            <button class="admin-image-remove" type="button" data-delete-listing-image="${image.id}" data-listing-id="${listingId}">x</button>
          </div>
        `
      )
      .join("");
  }

  function renderSelectedCover(fileInput) {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      return;
    }

    renderCoverPreview(URL.createObjectURL(file));
  }

  function renderSelectedGallery(fileInput) {
    const preview = document.getElementById("listing-gallery-preview");
    const files = Array.from(fileInput.files || []);

    if (!files.length || !preview) {
      return;
    }

    preview.innerHTML = files
      .map(
        (file) => `
          <div class="admin-image-thumb">
            <img src="${URL.createObjectURL(file)}" alt="${file.name}">
          </div>
        `
      )
      .join("");
  }

  function setListingMarket(value) {
    if (!value) {
      return;
    }

    const [city, state] = value.split("|");
    document.getElementById("listing-city").value = city || "";
    document.getElementById("listing-state").value = state || "";
  }

  function syncListingMarket() {
    const market = document.getElementById("listing-market");
    const city = document.getElementById("listing-city").value.trim().toLowerCase();
    const state = document.getElementById("listing-state").value.trim().toUpperCase();
    const match = Array.from(market.options).find((option) => {
      const [optionCity, optionState] = option.value.split("|");
      return optionCity && optionCity.toLowerCase() === city && optionState === state;
    });

    market.value = match ? match.value : "";
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
    const market = document.getElementById("listing-market");
    const city = document.getElementById("listing-city");
    const state = document.getElementById("listing-state");
    const coverInput = document.getElementById("listing-cover");
    const galleryInput = document.getElementById("listing-gallery");
    await loadListings();

    market.addEventListener("change", () => setListingMarket(market.value));
    city.addEventListener("input", syncListingMarket);
    state.addEventListener("change", syncListingMarket);
    coverInput.addEventListener("change", () => renderSelectedCover(coverInput));
    galleryInput.addEventListener("change", () => renderSelectedGallery(galleryInput));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = listingFormData(form);
      const id = data.get("id");
      data.delete("id");
      data.set("country", data.get("country") || "United States");
      data.set("state", normalizeState(data.get("state")));
      setStatus(dashboardStatus, id ? "Updating listing..." : "Creating listing...", "");

      try {
        if (id) {
          await api.updateListing(id, data);
        } else {
          await api.createListing(data);
        }
        form.reset();
        renderCoverPreview("");
        renderGalleryPreview("", []);
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

    form.addEventListener("click", async (event) => {
      const imageId = event.target.dataset.deleteListingImage;
      const listingId = event.target.dataset.listingId;

      if (!imageId || !listingId || !window.confirm("Remove this gallery image?")) {
        return;
      }

      try {
        await api.deleteListingImage(listingId, imageId);
        await loadListings();
        const listing = listings.find((item) => String(item.id) === String(listingId));
        fillListingForm(listing || {});
        setStatus(dashboardStatus, "Gallery image removed.", "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });

    document.getElementById("listing-form-reset").addEventListener("click", () => {
      form.reset();
      market.value = "";
      document.getElementById("listing-country").value = "United States";
      renderCoverPreview("");
      renderGalleryPreview("", []);
    });
  }

  function fillAgentForm(agent) {
    document.getElementById("agent-id").value = agent.id || "";
    document.getElementById("agent-name").value = agent.name || "";
    document.getElementById("agent-email").value = agent.email || "";
    document.getElementById("agent-phone").value = agent.phone || "";
    document.getElementById("agent-market").value = agent.market || "";
    document.getElementById("agent-title").value = agent.title || "";
    document.getElementById("agent-photo").value = agent.photo_url || "";
    document.getElementById("agent-photo-file").value = "";
    renderAgentPhotoPreview(agent.photo_url);
    document.getElementById("agent-bio").value = agent.bio || "";
  }

  function agentFormData(form) {
    const data = new FormData(form);

    Array.from(data.entries()).forEach(([key, value]) => {
      if (value === "" || (typeof File !== "undefined" && value instanceof File && !value.name)) {
        data.delete(key);
      }
    });

    return data;
  }

  function renderAgentPhotoPreview(imageUrl) {
    const preview = document.getElementById("agent-photo-preview");

    if (!preview) {
      return;
    }

    preview.innerHTML = imageUrl
      ? `<div class="admin-image-thumb"><img src="${absoluteApiUrl(imageUrl)}" alt="Agent photo"></div>`
      : "";
  }

  function renderSelectedAgentPhoto(fileInput) {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      return;
    }

    renderAgentPhotoPreview(URL.createObjectURL(file));
  }

  async function loadAgents() {
    const data = await api.listAgents();
    agents = data.agents || [];
    renderAgents();
  }

  async function loadLeads() {
    const statusFilter = document.getElementById("lead-status-filter");
    const statusValue = statusFilter ? statusFilter.value : "";
    const data = await api.listLeads(statusValue ? { status: statusValue } : null);
    leads = data.leads || [];
    renderLeads();
  }

  async function initLeads() {
    if (!(await requireAdmin())) {
      return;
    }

    const list = document.getElementById("admin-leads-list");
    const filter = document.getElementById("lead-status-filter");
    const agentData = await api.listAgents();
    agents = agentData.agents || [];
    await loadLeads();

    if (filter) {
      filter.addEventListener("change", async () => {
        setStatus(dashboardStatus, "Loading leads...", "");
        try {
          await loadLeads();
          setStatus(dashboardStatus, "", "");
        } catch (error) {
          setStatus(dashboardStatus, error.message, "error");
        }
      });
    }

    list.addEventListener("click", async (event) => {
      const leadId = event.target.dataset.saveLead;

      if (!leadId) {
        return;
      }

      const statusSelect = list.querySelector(`[data-lead-status="${leadId}"]`);
      const agentSelect = list.querySelector(`[data-lead-agent="${leadId}"]`);
      setStatus(dashboardStatus, "Updating lead...", "");

      try {
        await api.updateLead(leadId, {
          status: statusSelect.value,
          assigned_agent_id: agentSelect.value || null,
        });
        await loadLeads();
        setStatus(dashboardStatus, "Lead updated.", "success");
      } catch (error) {
        setStatus(dashboardStatus, error.message, "error");
      }
    });
  }

  async function initAgents() {
    if (!(await requireAdmin())) {
      return;
    }

    const form = document.getElementById("admin-agent-form");
    const list = document.getElementById("admin-agents-list");
    const photoInput = document.getElementById("agent-photo-file");
    await loadAgents();

    photoInput.addEventListener("change", () => renderSelectedAgentPhoto(photoInput));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = agentFormData(form);
      const id = data.get("id");
      data.delete("id");
      setStatus(dashboardStatus, id ? "Updating agent..." : "Creating agent...", "");

      try {
        if (id) {
          await api.updateAgent(id, data);
        } else {
          await api.createAgent(data);
        }
        form.reset();
        renderAgentPhotoPreview("");
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

    document.getElementById("agent-form-reset").addEventListener("click", () => {
      form.reset();
      renderAgentPhotoPreview("");
    });
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
  } else if (page === "leads") {
    initLeads();
  } else if (page === "agents") {
    initAgents();
  } else if (page === "account") {
    initAccount();
  }
})();
