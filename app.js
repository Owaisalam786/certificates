(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const allCertificates = Array.isArray(window.CERTIFICATES) ? window.CERTIFICATES : [];
  const config = window.SITE_CONFIG || {};
  const grid = $("#certificate-grid");
  const search = $("#search-input");
  const categoryFilter = $("#category-filter");
  const sortSelect = $("#sort-select");
  const resultsLabel = $("#results-label");
  const emptyState = $("#empty-state");
  const clearButton = $("#clear-filters");
  const dialog = $("#certificate-dialog");
  let lastFocused = null;
  let toastTimer;

  const safeText = (value) => String(value ?? "");
  const escapeHTML = (value) => safeText(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const validUrl = (value) => {
    try { const url = new URL(value, window.location.origin); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
    catch { return ""; }
  };
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value.length === 4 ? value + "-01-01T12:00:00" : value);
    if (Number.isNaN(date.getTime())) return safeText(value);
    return new Intl.DateTimeFormat(undefined, {year:"numeric", month:"short"}).format(date);
  };
  const getCategories = () => [...new Set(allCertificates.map(c => safeText(c.category).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const categoryCounts = () => allCertificates.reduce((acc,c)=>{const category=safeText(c.category).trim()||"Other";acc[category]=(acc[category]||0)+1;return acc;},{});
  const placeholder = (title) => '<div class="preview-placeholder" aria-hidden="true"><div class="preview-paper"><span>✳</span><strong>'+escapeHTML(title || "Certificate")+'</strong><div class="preview-lines"></div><div class="preview-lines short"></div><div class="preview-lines"></div></div></div>';
  const previewMarkup = (cert) => {
    const image = validUrl(cert.image);
    const file = validUrl(cert.file);
    if (image) return '<img src="'+escapeHTML(image)+'" alt="Preview of '+escapeHTML(cert.title)+'" loading="lazy" onerror="this.outerHTML=\''+placeholder(cert.title).replace(/'/g,"&#39;")+'\'">';
    if (file && /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(file)) return '<img src="'+escapeHTML(file)+'" alt="Preview of '+escapeHTML(cert.title)+'" loading="lazy" onerror="this.outerHTML=\''+placeholder(cert.title).replace(/'/g,"&#39;")+'\'">';
    if (file && /\.pdf(\?|#|$)/i.test(file)) return '<iframe title="Preview of '+escapeHTML(cert.title)+'" src="'+escapeHTML(file)+'#page=1&toolbar=0&navpanes=0&scrollbar=0" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>';
    return placeholder(cert.title);
  };
  const filteredCertificates = () => {
    const query = search.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const items = allCertificates.filter(cert => {
      const haystack = [cert.title,cert.issuer,cert.category,cert.description,...(Array.isArray(cert.skills)?cert.skills:[])].map(safeText).join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!category || safeText(cert.category).trim() === category);
    });
    const sort = sortSelect.value;
    items.sort((a,b) => {
      if(sort==="title") return safeText(a.title).localeCompare(safeText(b.title));
      const da = Date.parse(a.issueDate || "") || 0, db = Date.parse(b.issueDate || "") || 0;
      return sort==="oldest" ? da-db : db-da;
    });
    return items;
  };
  function renderCards() {
    const items = filteredCertificates();
    $("#total-count").textContent = allCertificates.length;
    resultsLabel.textContent = "Showing " + items.length + " of " + allCertificates.length + " certificate" + (allCertificates.length===1?"":"s");
    clearButton.hidden = !(search.value || categoryFilter.value || sortSelect.value!=="newest");
    grid.innerHTML = items.map((cert,index) => {
      const category = safeText(cert.category).trim() || "Other";
      const issuer = safeText(cert.issuer).trim() || "Issuer not specified";
      return '<article class="certificate-card" style="animation-delay:'+Math.min(index*45,270)+'ms"><div class="certificate-preview">'+previewMarkup(cert)+'<span class="preview-type">'+(validUrl(cert.file)&&/\.pdf(\?|#|$)/i.test(cert.file)?"PDF DOCUMENT":"CERTIFICATE")+'</span></div><div class="card-content"><span class="card-category">'+escapeHTML(category)+'</span><h3 class="card-title">'+escapeHTML(cert.title || "Untitled certificate")+'</h3><div class="card-issuer"><span class="issuer-dot"></span>'+escapeHTML(issuer)+'</div><div class="card-bottom"><span class="card-date">'+escapeHTML(formatDate(cert.issueDate)||"Learning milestone")+'</span><button class="view-link" type="button" data-view="'+escapeHTML(cert.id)+'">View certificate <span aria-hidden="true">↗</span></button></div></div></article>';
    }).join("");
    emptyState.hidden = items.length > 0;
    grid.hidden = items.length === 0;
    if (!allCertificates.length) {
      $("#empty-title").textContent = "Your next discovery awaits.";
      $("#empty-copy").textContent = "Certificates will appear here as they’re added to the collection.";
      $("#empty-reset").hidden = true;
    } else if (!items.length) {
      $("#empty-title").textContent = "No matches this time.";
      $("#empty-copy").textContent = "Try a different search term or clear your filters to see all certificates.";
      $("#empty-reset").hidden = false;
    }
    grid.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
      const cert = allCertificates.find(c => safeText(c.id) === button.dataset.view);
      if(cert) openCertificate(cert);
    }));
  }
  function renderCategories() {
    const categories = getCategories();
    categoryFilter.innerHTML = '<option value="">All categories</option>' + categories.map(c=>'<option value="'+escapeHTML(c)+'">'+escapeHTML(c)+'</option>').join("");
    const counts = categoryCounts();
    const list = $("#category-list");
    list.innerHTML = categories.length ? categories.map(c=>'<button class="category-pill" type="button" data-category="'+escapeHTML(c)+'">'+escapeHTML(c)+' <span>'+counts[c]+'</span></button>').join("") : '<p class="category-hint">Your certificate topics will appear here as the collection grows.</p>';
    list.querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>{
      categoryFilter.value = categoryFilter.value === button.dataset.category ? "" : button.dataset.category;
      renderCards();
      list.querySelectorAll(".category-pill").forEach(p=>p.classList.toggle("active",p.dataset.category===categoryFilter.value));
      $("#certificates").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    }));
  }
  function showToast(message) {
    const toast=$("#toast"); toast.textContent=message; toast.classList.add("visible");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("visible"),2600);
  }
  function openCertificate(cert) {
    lastFocused=document.activeElement;
    $("#dialog-title").textContent=cert.title || "Certificate";
    const stage=$("#document-stage"), details=$("#dialog-details");
    const file=validUrl(cert.file), image=validUrl(cert.image);
    const isPdf=file && /\.pdf(\?|#|$)/i.test(file);
    const imageFile=file && /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(file);
    if(isPdf) stage.innerHTML='<iframe title="PDF certificate preview" src="'+escapeHTML(file)+'#view=FitH" loading="lazy"></iframe>';
    else if(image || imageFile) stage.innerHTML='<img src="'+escapeHTML(imageFile?file:image)+'" alt="Full certificate: '+escapeHTML(cert.title)+'" onerror="this.outerHTML=\'<div class=&quot;empty-state&quot;><h3>Preview unavailable</h3><p>Open the original file using the link beside this preview.</p></div>\'">';
    else stage.innerHTML=placeholder(cert.title)+'<p class="detail-description">Add a preview image or original file path to show the certificate here.</p>';
    const rows = [
      ["Issuing organization",cert.issuer],["Category",cert.category],["Issue date",formatDate(cert.issueDate)],["Credential ID",cert.credentialId]
    ].filter(row=>safeText(row[1]).trim());
    details.innerHTML=rows.map(row=>'<div class="detail-row"><dt>'+escapeHTML(row[0])+'</dt><dd>'+escapeHTML(row[1])+'</dd></div>').join("");
    if(cert.description) details.innerHTML+='<p class="detail-description">'+escapeHTML(cert.description)+'</p>';
    if(Array.isArray(cert.skills)&&cert.skills.length) details.innerHTML+='<div class="detail-row"><dt>Skills and topics</dt><dd>'+cert.skills.map(escapeHTML).join(" · ")+'</dd></div>';
    let actions='<div class="detail-actions">';
    if(file) actions+='<a class="button button-primary" href="'+escapeHTML(file)+'" target="_blank" rel="noopener noreferrer">'+(isPdf?"Open original PDF":"Open original file")+' ↗</a><a class="button button-secondary" href="'+escapeHTML(file)+'" download>Download certificate ↓</a>';
    const verify=validUrl(cert.verificationUrl);
    if(verify) actions+='<a class="button button-secondary" href="'+escapeHTML(verify)+'" target="_blank" rel="noopener noreferrer">Verify credential ↗</a>';
    actions+='</div>';
    details.innerHTML+=actions;
    if(typeof dialog.showModal==="function") {dialog.showModal();document.body.classList.add("dialog-open");$("#dialog-close").focus();}
    else showToast("Your browser does not support the certificate viewer. Please open the original file from its card.");
  }
  function closeDialog(){if(dialog.open)dialog.close();document.body.classList.remove("dialog-open");if(lastFocused&&typeof lastFocused.focus==="function")lastFocused.focus();}
  search.addEventListener("input",renderCards);
  categoryFilter.addEventListener("change",()=>{renderCards();$("#category-list").querySelectorAll(".category-pill").forEach(p=>p.classList.toggle("active",p.dataset.category===categoryFilter.value));});
  sortSelect.addEventListener("change",renderCards);
  function resetFilters(){search.value="";categoryFilter.value="";sortSelect.value="newest";$("#category-list").querySelectorAll(".category-pill").forEach(p=>p.classList.remove("active"));renderCards();}
  clearButton.addEventListener("click",resetFilters);$("#empty-reset").addEventListener("click",resetFilters);
  $("#dialog-close").addEventListener("click",closeDialog);
  dialog.addEventListener("click",event=>{if(event.target===dialog)closeDialog();});
  dialog.addEventListener("close",()=>{document.body.classList.remove("dialog-open");if(lastFocused&&typeof lastFocused.focus==="function")lastFocused.focus();});
  document.addEventListener("keydown",event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();search.focus();}if(event.key==="Escape"&&dialog.open)closeDialog();});
  const menuButton=$("#menu-toggle"), nav=$("#primary-nav");
  menuButton.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?"Close navigation menu":"Open navigation menu");});
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");menuButton.setAttribute("aria-label","Open navigation menu");}));
  function renderContact(){
    const links=[
      {label:"GitHub",symbol:"⌘",url:validUrl(config.github)},
      {label:"LinkedIn",symbol:"in",url:validUrl(config.linkedin)},
      {label:"Email",symbol:"✉",url:config.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)?"mailto:"+config.email:""}
    ].filter(link=>link.url);
    $("#contact-links").innerHTML=links.length?links.map(link=>'<a class="contact-link" href="'+escapeHTML(link.url)+'" '+(link.url.startsWith("mailto:")?'':'target="_blank" rel="noopener noreferrer"')+'><span><span class="contact-symbol">'+escapeHTML(link.symbol)+'</span>'+escapeHTML(link.label)+'</span><span class="arrow" aria-hidden="true">↗</span></a>').join(""):'<p class="detail-description" style="color:#c3ccdf">Contact links will appear here when configured.</p>';
  }
  renderCategories();renderCards();renderContact();
})();