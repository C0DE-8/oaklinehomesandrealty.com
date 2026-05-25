(function () {
  const api = window.OaklinePublicApi;
  const fallbackListingImage = "assets/images/home/hero-apartments.png";
  const detailPage = "listings/165-774.html";

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

  function listingTitle(listing) {
    return listing.listing_code ? `#OaklineHomes${listing.listing_code}` : listing.title || "Oakline Listing";
  }

  function listingLocation(listing) {
    return [listing.city, listing.state].filter(Boolean).join(", ") || "United States";
  }

  function detailHref(listing) {
    return `${detailPage}?slug=${encodeURIComponent(listing.slug)}`;
  }

  function renderListingCard(listing) {
    return `
      <div role="listitem" class="property-item w-dyn-item">
        <a href="${escapeHtml(detailHref(listing))}" class="property-link-border w-inline-block">
          <div class="property-image-short">
            <img loading="lazy" alt="${escapeHtml(listing.title || "")}" src="${escapeHtml(
              listingImage(listing)
            )}" sizes="(max-width: 479px) 90vw, (max-width: 767px) 80vw, (max-width: 991px) 42vw, 28vw" class="image-full" />
            <div class="price-block-grey">
              <div class="listings-price">
                <div class="card-price-text">starting</div>
                <div class="text-block">${escapeHtml(money(listing.price))}</div>
              </div>
            </div>
          </div>
          <div class="property-content-padding">
            <h5 class="h5-title padding-bottom-8">${escapeHtml(listingTitle(listing))}</h5>
            <div class="listings-neighborhood"><p class="paragraph-small">${escapeHtml(listingLocation(listing))}</p></div>
            <div class="detail-wrapper">
              <div class="detail-item">
                <img src="assets/images/icons/Bed.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="listings-bedrooms"><div class="text-block">${escapeHtml(listing.bedrooms || 0)}</div></div>
                <div>bd</div>
              </div>
              <div class="line-break-small"></div>
              <div class="detail-item">
                <img src="assets/images/icons/Shower.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="listings-bathrooms"><div class="text-block">${escapeHtml(listing.bathrooms || 0)}</div></div>
                <div>ba</div>
              </div>
              <div class="line-break-small"></div>
              <div class="detail-item">
                <img src="assets/images/icons/Ruler.svg" loading="lazy" alt="" class="listing-detail-icon detail-icon" />
                <div class="listings-sqft"><div class="text-block">${escapeHtml(listing.square_feet || 0)}</div></div>
                <div>sqft</div>
              </div>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  function renderSkeletonCard() {
    return `
      <div role="listitem" class="property-item w-dyn-item listing-skeleton-card" aria-hidden="true">
        <div class="property-link-border w-inline-block">
          <div class="property-image-short"><div class="listing-skeleton-media"></div></div>
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

  function setStatus(message) {
    const list = document.querySelector(".property-collection-normal");
    if (list) {
      list.innerHTML = `<div class="w-dyn-empty"><div>${escapeHtml(message)}</div></div>`;
    }
  }

  async function loadListings() {
    const list = document.querySelector(".property-collection-normal");

    if (!api || !list) {
      return;
    }

    list.innerHTML = Array.from({ length: 6 }, renderSkeletonCard).join("");

    try {
      const data = await api.listListings();
      const listings = data.listings || [];
      list.innerHTML = listings.length ? listings.map(renderListingCard).join("") : "";

      if (!listings.length) {
        setStatus("No active listings yet.");
      }
    } catch (error) {
      console.error("Unable to load listings", error);
      setStatus("Listings could not load from the API.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadListings);
})();
