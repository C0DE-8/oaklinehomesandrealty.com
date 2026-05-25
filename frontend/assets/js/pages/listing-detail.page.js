(function () {
  const api = window.OaklinePublicApi;
  const fallbackListingImage = "../assets/images/home/hero-apartments.png";
  let currentListing = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return Number(value || 0).toLocaleString("en-US", {
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

  function listingSlug() {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("slug") || params.get("listing");

    if (querySlug) {
      return querySlug;
    }

    return window.location.pathname.split("/").pop().replace(/\.html$/, "");
  }

  function listingTitle(listing) {
    return listing.listing_code ? `#OaklineHomes${listing.listing_code}` : listing.title || "Oakline Listing";
  }

  function listingLocation(listing) {
    return [listing.city, listing.state].filter(Boolean).join(", ") || "United States";
  }

  function imageList(listing) {
    const images = listing.images && listing.images.length ? listing.images : [];
    const urls = images.map((image) => image.image_url).filter(Boolean);

    if (listing.cover_image_url) {
      urls.unshift(listing.cover_image_url);
    }

    return Array.from(new Set(urls)).map((url) => assetUrl(url, fallbackListingImage));
  }

  function listingImage(listing) {
    return imageList(listing)[0] || fallbackListingImage;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function setMeta(selector, value) {
    document.querySelectorAll(selector).forEach((meta) => {
      meta.setAttribute("content", value || "");
    });
  }

  function setDocumentMeta(listing) {
    const title = listingTitle(listing);
    const description = listing.description || "";
    const image = imageList(listing)[0] || fallbackListingImage;

    document.title = `${title} | Oakline Homes and Realty`;
    setMeta('meta[property="og:title"], meta[property="twitter:title"]', title);
    setMeta('meta[name="description"], meta[property="og:description"], meta[property="twitter:description"]', description);
    setMeta('meta[property="og:image"], meta[property="twitter:image"]', image);
  }

  function renderHeroImages(listing) {
    const images = imageList(listing);
    const heroImage = document.querySelector(".property-hero-image img");
    const smallList = document.querySelector(".property-gallery-small .collection-list-4");
    const heroGallery = document.querySelector(".gallery-collection-hero");
    const fullGallery = document.querySelector(".gallery-collection");

    if (heroImage) {
      heroImage.src = images[0] || fallbackListingImage;
      heroImage.alt = listing.title || "";
    }

    if (smallList) {
      smallList.innerHTML = images
        .slice(0, 4)
        .map(
          (src) =>
            `<div role="listitem" class="w-dyn-item w-dyn-repeater-item"><div class="property-hero-cell"><img src="${escapeHtml(
              src
            )}" loading="lazy" alt="${escapeHtml(listing.title || "")}" class="property-hero-grid"/></div></div>`
        )
        .join("");
    }

    const galleryItem = (src) => `<div role="listitem" class="collection-item w-dyn-item w-dyn-repeater-item">
      <a href="${escapeHtml(src)}" class="gallery-item w-inline-block">
        <img alt="${escapeHtml(listing.title || "")}" src="${escapeHtml(src)}" class="avatar-image"/>
      </a>
    </div>`;
    const heroGalleryMarkup = images.slice(0, 4).map(galleryItem).join("");
    const galleryMarkup = images
      .map(
        galleryItem
      )
      .join("");

    if (heroGallery) {
      heroGallery.innerHTML = heroGalleryMarkup;
    }

    if (fullGallery) {
      fullGallery.innerHTML = galleryMarkup;
    }
  }

  function renderDetails(listing) {
    const detailBlock = document.querySelector(".detail-wrapper-block");

    if (!detailBlock) {
      return;
    }

    detailBlock.innerHTML = `
      <div class="detail-item"><img src="../assets/images/icons/Bed.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon"/><div class="text-block">${escapeHtml(
        listing.bedrooms || 0
      )}</div><div>bedroom</div></div>
      <div class="line-break-detail"></div>
      <div class="detail-item"><img src="../assets/images/icons/Shower.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon"/><div class="text-block">${escapeHtml(
        listing.bathrooms || 0
      )}</div><div>bathroom</div></div>
      <div class="line-break-detail"></div>
      <div class="detail-item"><img src="../assets/images/icons/Ruler.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon"/><div class="text-block">${escapeHtml(
        listing.square_feet || 0
      )}</div><div>sqft</div></div>
    `;
  }

  function renderFeatures(listing) {
    const list = document.getElementById("Features");
    const features = listing.features || [];

    if (!list) {
      return;
    }

    list.innerHTML = features.length
      ? features
          .map((feature) => `<div role="listitem" class="w-dyn-item"><div class="feature"><div>${escapeHtml(feature.feature_name)}</div></div></div>`)
          .join("")
      : '<div role="listitem" class="w-dyn-item"><div class="feature"><div>No property features listed yet.</div></div></div>';
  }

  function setInputValue(selector, value) {
    const input = document.querySelector(selector);

    if (input) {
      input.value = value == null ? "" : value;
    }
  }

  function syncLeadFormListingFields(listing) {
    setInputValue('input[name="bedrooms"]', listing.bedrooms || "");
    setInputValue('input[name="bathrooms"]', listing.bathrooms || "");
    setInputValue('input[name="max-budget"]', listing.price || "");
    setInputValue('input[name="property-id"]', listing.id || "");
    setInputValue('input[name="property-title"]', listingTitle(listing));
    setInputValue('input[name="property-slug"]', listing.slug || "");
  }

  function renderLatestCard(listing) {
    const href = `165-774.html?slug=${encodeURIComponent(listing.slug)}`;

    return `
      <div role="listitem" class="property-item w-dyn-item">
        <a href="${escapeHtml(href)}" class="property-link w-inline-block">
          <div class="property-image-wrap">
            <img
              loading="lazy"
              alt="${escapeHtml(listing.title || "")}"
              src="${escapeHtml(listingImage(listing))}"
              sizes="(max-width: 767px) 94vw, (max-width: 991px) 45vw, 30vw"
              class="image-full"
            />
            <div class="price-block"><div>${escapeHtml(money(listing.price))}</div></div>
          </div>
          <div class="property-content">
            <h5 class="h5-title padding-bottom-8">${escapeHtml(listingTitle(listing))}</h5>
            <p class="paragraph-small">${escapeHtml(listingLocation(listing))}</p>
            <div class="detail-wrapper">
              <div class="detail-item">
                <img src="../assets/images/icons/Bed.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="text-block">${escapeHtml(listing.bedrooms || 0)}</div>
                <div>bd</div>
              </div>
              <div class="line-break-small"></div>
              <div class="detail-item">
                <img src="../assets/images/icons/Shower.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="text-block">${escapeHtml(listing.bathrooms || 0)}</div>
                <div>ba</div>
              </div>
              <div class="line-break-small"></div>
              <div class="detail-item">
                <img src="../assets/images/icons/Ruler.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="text-block">${escapeHtml(listing.square_feet || 0)}</div>
                <div>sqft</div>
              </div>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function renderLatestStatus(message) {
    const list = document.querySelector(".latest-property-wrapper .property-collection");

    if (list) {
      list.innerHTML = `<div class="w-dyn-empty"><div>${escapeHtml(message)}</div></div>`;
    }
  }

  async function renderLatest(currentListing) {
    const list = document.querySelector(".latest-property-wrapper .property-collection");

    if (!list) {
      return;
    }

    list.innerHTML = '<div class="w-dyn-empty"><div>Loading latest listings...</div></div>';

    try {
      const data = await api.listListings();
      const latest = (data.listings || [])
        .filter((listing) => listing.slug && listing.slug !== currentListing.slug)
        .slice(0, 3);

      list.innerHTML = latest.length ? latest.map(renderLatestCard).join("") : "";

      if (!latest.length) {
        renderLatestStatus("No other active listings yet.");
      }
    } catch (error) {
      console.error("Unable to load latest listings", error);
      renderLatestStatus("Latest listings could not load from the API.");
    }
  }

  function renderListing(listing) {
    currentListing = listing;
    setDocumentMeta(listing);
    setText(".property-title-large", listingTitle(listing));
    setText(".property-price", money(listing.price));
    setText(".property-title .property-detail-wrap:last-child p", listingLocation(listing));
    setText(".paragraph-dark", listing.description || "");
    setText(".lisiting-code", listing.listing_code || listing.id || "");

    renderHeroImages(listing);
    renderDetails(listing);
    renderFeatures(listing);
    syncLeadFormListingFields(listing);
    renderLatest(listing);
  }

  function serializeLeadForm(form) {
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.pageUrl = window.location.href;

    if (currentListing) {
      data.propertyId = currentListing.id;
      data.propertyTitle = listingTitle(currentListing);
      data.propertySlug = currentListing.slug;
      data.bedrooms = currentListing.bedrooms;
      data.bathrooms = currentListing.bathrooms;
      data.maxBudget = currentListing.price;
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
    const form = document.querySelector(".property-contact-form-container .fancy-form");

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

  async function loadListing() {
    if (!api) {
      return;
    }

    renderLatestStatus("Loading latest listings...");

    try {
      const data = await api.getListing(listingSlug());
      renderListing(data.listing);
    } catch (error) {
      console.error("Unable to load listing", error);
      setText(".property-title-large", "Listing not found");
      setText(".paragraph-dark", "This listing is not active or could not be loaded.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLeadForm();
    loadListing();
  });
})();
