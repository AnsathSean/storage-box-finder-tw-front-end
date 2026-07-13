const form = document.querySelector("#dimension-form");
const widthInput = document.querySelector("#space-width");
const depthInput = document.querySelector("#space-depth");
const heightInput = document.querySelector("#space-height");
const channelFilter = document.querySelector("#channel-filter");
const lidFilter = document.querySelector("#lid-filter");
const stackFilter = document.querySelector("#stack-filter");
const resultCount = document.querySelector("#result-count");
const resultHint = document.querySelector("#result-hint");
const productList = document.querySelector("#product-list");

function formatPrice(price) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value.toFixed(1));
}

function getSearchParams() {
  return {
    width: Number(widthInput.value),
    depth: Number(depthInput.value),
    height: Number(heightInput.value),
    channel: channelFilter.value,
    hasLidOnly: lidFilter.checked,
    stackableOnly: stackFilter.checked,
  };
}

function fitsSpace(product, params) {
  return (
    product.widthCm <= params.width &&
    product.depthCm <= params.depth &&
    product.heightCm <= params.height
  );
}

function matchesFilters(product, params) {
  if (params.channel !== "all" && product.channel !== params.channel) return false;
  if (params.hasLidOnly && !product.hasLid) return false;
  if (params.stackableOnly && !product.isStackable) return false;
  return true;
}

function getFitScore(product, params) {
  const widthUse = product.widthCm / params.width;
  const depthUse = product.depthCm / params.depth;
  const heightUse = product.heightCm / params.height;
  return widthUse + depthUse + heightUse;
}

function renderChannels() {
  const channels = [...new Set(products.map((product) => product.channel))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant")
  );

  channels.forEach((channel) => {
    const option = document.createElement("option");
    option.value = channel;
    option.textContent = channel;
    channelFilter.append(option);
  });
}

function renderProducts(items) {
  productList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("article");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h2>目前沒有符合的收納盒</h2>
      <p>可以試著放寬尺寸、取消篩選，或之後補更多商品資料。</p>
    `;
    productList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
      <div class="product-body">
        <div class="product-heading">
          <p>${product.brand}</p>
          <h2>${product.name}</h2>
        </div>

        <dl class="specs">
          <div>
            <dt>尺寸</dt>
            <dd>寬 ${formatNumber(product.widthCm)} × 深 ${formatNumber(product.depthCm)} × 高 ${formatNumber(product.heightCm)} cm</dd>
          </div>
          <div>
            <dt>價格</dt>
            <dd>${formatPrice(product.priceTwd)}</dd>
          </div>
          <div>
            <dt>通路</dt>
            <dd>${product.channel}</dd>
          </div>
        </dl>

        <div class="tags">
          <span>${product.category}</span>
          <span>${product.material}</span>
          ${product.hasLid ? "<span>有蓋</span>" : ""}
          ${product.isTransparent ? "<span>透明</span>" : ""}
          ${product.isStackable ? "<span>可堆疊</span>" : ""}
        </div>

        <div class="actions">
          <a class="secondary-link" href="${product.purchaseUrl}" target="_blank" rel="noreferrer">查看</a>
          <a class="primary-link" href="${product.purchaseUrl}" target="_blank" rel="noreferrer">前往購買</a>
        </div>
      </div>
    `;
    fragment.append(card);
  });

  productList.append(fragment);
}

function updateResults() {
  const params = getSearchParams();
  const hasInvalidDimension = [params.width, params.depth, params.height].some(
    (value) => Number.isNaN(value) || value <= 0
  );

  if (hasInvalidDimension) {
    resultCount.textContent = "請輸入有效尺寸";
    resultHint.textContent = "寬、深、高都需要大於 0 cm。";
    renderProducts([]);
    return;
  }

  const matchedProducts = products
    .filter((product) => fitsSpace(product, params))
    .filter((product) => matchesFilters(product, params))
    .sort((a, b) => getFitScore(b, params) - getFitScore(a, params));

  resultCount.textContent = `符合 ${matchedProducts.length} 個收納盒`;
  resultHint.textContent = `可用空間：寬 ${formatNumber(params.width)} × 深 ${formatNumber(params.depth)} × 高 ${formatNumber(params.height)} cm`;
  renderProducts(matchedProducts);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateResults();
});

[widthInput, depthInput, heightInput, channelFilter, lidFilter, stackFilter].forEach((control) => {
  control.addEventListener("input", updateResults);
  control.addEventListener("change", updateResults);
});

renderChannels();
updateResults();
