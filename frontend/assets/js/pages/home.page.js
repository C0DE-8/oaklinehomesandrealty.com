(function () {
  const api = window.OaklinePublicApi;
  const fallbackListingImage = "assets/images/home/hero-apartments.png";
  const fallbackAgentImage = "assets/images/branding/icon.png";
  const listingTabs = [
    { label: "Apartment", type: "apartment" },
    { label: "Condo", type: "condo" },
    { label: "House", type: "house" },
    { label: "Townhome", type: "townhome" },
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    const number = Number(value || 0);
    return number.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
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

  function listingImage(listing) {
    const primary = (listing.images || []).find((image) => image.is_primary) || (listing.images || [])[0];
    return assetUrl(listing.cover_image_url || (primary && primary.image_url), fallbackListingImage);
  }

  function listingLocation(listing) {
    return [listing.city, listing.state].filter(Boolean).join(", ") || "United States";
  }

  function listingTitle(listing) {
    if (listing.listing_code) {
      return `#OaklineHomes${listing.listing_code}`;
    }

    return listing.title || "Oakline Listing";
  }

  function renderListingCard(listing) {
    const href = `listings/165-774.html?slug=${encodeURIComponent(listing.slug)}`;

    return `
      <div role="listitem" class="property-item collection-item-2 w-dyn-item">
        <a href="${href}" class="property-link-border w-inline-block">
          <div class="property-image-short">
            <img loading="lazy" alt="${escapeHtml(listing.title || "")}" src="${escapeHtml(
              listingImage(listing)
            )}" sizes="100vw" class="image-full" />
            <div class="price-block"><div>${escapeHtml(money(listing.price))}</div></div>
          </div>
          <div class="property-content-padding">
            <h5 class="h5-title padding-bottom-8">${escapeHtml(listingTitle(listing))}</h5>
            <p class="paragraph-small">${escapeHtml(listingLocation(listing))}</p>
            <div class="detail-wrapper">
              <div class="detail-item"><img src="assets/images/icons/Bed.svg" loading="lazy" alt="" class="listing-detail-icon" /><div class="text-block">${escapeHtml(listing.bedrooms || 0)}</div><div>bd</div></div>
              <div class="line-break-small"></div>
              <div class="detail-item"><img src="assets/images/icons/Shower.svg" loading="lazy" alt="" class="listing-detail-icon" /><div class="text-block">${escapeHtml(listing.bathrooms || 0)}</div><div>ba</div></div>
              <div class="line-break-small"></div>
              <div class="detail-item"><img src="assets/images/icons/Ruler.svg" loading="lazy" alt="" class="listing-detail-icon" /><div class="text-block">${escapeHtml(listing.square_feet || 0)}</div><div>sqft</div></div>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function renderListingEmptyCard(message) {
    return `
      <div role="listitem" class="property-item collection-item-2 w-dyn-item listing-empty-card">
        <div class="property-link-border w-inline-block">
          <div class="property-image-short">
            <div class="listing-empty-message">${escapeHtml(message)}</div>
          </div>
          <div class="property-content-padding">
            <div class="listing-skeleton-line title"></div>
            <div class="listing-skeleton-line location"></div>
            <div class="detail-wrapper">
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
              <div class="line-break-small"></div>
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
              <div class="line-break-small"></div>
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderListingSkeletonCard() {
    return `
      <div role="listitem" class="property-item collection-item-2 w-dyn-item listing-skeleton-card" aria-hidden="true">
        <div class="property-link-border w-inline-block">
          <div class="property-image-short">
            <div class="listing-skeleton-media"></div>
          </div>
          <div class="property-content-padding">
            <div class="listing-skeleton-line title"></div>
            <div class="listing-skeleton-line location"></div>
            <div class="detail-wrapper">
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
              <div class="line-break-small"></div>
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
              <div class="line-break-small"></div>
              <div class="listing-skeleton-detail"><div class="listing-skeleton-pill"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderListingSkeletons() {
    return Array.from({ length: 3 }, renderListingSkeletonCard).join("");
  }

  function setListingMessage(message) {
    document.querySelectorAll(".listings-tabs-centre .property-collection").forEach((list) => {
      list.innerHTML = renderListingEmptyCard(message);
    });
  }

  function setListingSkeletons() {
    document.querySelectorAll(".listings-tabs-centre .property-collection").forEach((list) => {
      list.innerHTML = renderListingSkeletons();
    });
  }

  function renderListings(listings) {
    const panes = document.querySelectorAll(".listings-tabs-centre .w-tab-pane");
    if (!panes.length) {
      return;
    }

    if (!listings.length) {
      setListingMessage("No active listings yet.");
      return;
    }

    listingTabs.forEach((tab, index) => {
      const pane = panes[index];
      const list = pane && pane.querySelector(".property-collection");

      if (!list) {
        return;
      }

      const matching = listings.filter((listing) => listing.property_type === tab.type).slice(0, 3);

      list.innerHTML = matching.length
        ? matching.map(renderListingCard).join("")
        : renderListingEmptyCard(`No active ${tab.label.toLowerCase()} listings yet.`);
    });
  }

  function renderAgentCard(agent) {
    return `
      <div role="listitem" class="w-dyn-item">
        <a href="agents/info.html?id=${encodeURIComponent(agent.id)}" class="agent-wrapper w-inline-block">
          <div class="agent-image">
            <img loading="lazy" alt="${escapeHtml(agent.name)}" src="${escapeHtml(
              assetUrl(agent.photo_url, fallbackAgentImage)
            )}" sizes="100vw" class="image-full" />
          </div>
          <div class="agent-content">
            <h5 class="h5-title">${escapeHtml(agent.name)}</h5>
            <p>${escapeHtml(agent.title || agent.market || "Agent")}</p>
          </div>
        </a>
      </div>
    `;
  }

  function renderAgents(agents) {
    const list = document.querySelector(".agent-collection");
    if (!list || !agents.length) {
      return;
    }

    list.innerHTML = agents.slice(0, 3).map(renderAgentCard).join("");
  }

  function replaceReviewBranding(root) {
    if (!root) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;

        if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        return /fancy apartments?/i.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      node.nodeValue = node.nodeValue.replace(/fancy apartments?/gi, "Oakline Apartments");
    });
  }

  function normalizeReviewBranding() {
    const reviews = document.querySelector(".elfsight-app-1d1a5264-0f77-4d86-902f-90c252a2c8bf");

    if (!reviews) {
      return;
    }

    replaceReviewBranding(reviews);

    const observer = new MutationObserver(() => {
      replaceReviewBranding(reviews);
    });

    observer.observe(reviews, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.setTimeout(() => observer.disconnect(), 15000);
  }

  async function loadHomeData() {
    if (!api) {
      return;
    }

    setListingSkeletons();

    try {
      const [listingData, agentData] = await Promise.all([api.listListings(), api.listAgents()]);
      renderListings(listingData.listings || []);
      renderAgents(agentData.agents || []);
    } catch (error) {
      console.error("Unable to load home page data", error);
      setListingMessage("Listings could not load from the API.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadHomeData);
  document.addEventListener("DOMContentLoaded", normalizeReviewBranding);
})();
