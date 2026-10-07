(() => {
  if (window.__frameSearchSelector) return;
  window.__frameSearchSelector = true;

  const style = document.createElement("style");
  style.textContent =
    "#frame-search-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;cursor:crosshair!important;background:rgba(0,0,0,.16)!important;font-family:system-ui,sans-serif!important}" +
    "#frame-search-box{position:fixed!important;border:2px solid #fff!important;box-shadow:0 0 0 99999px rgba(0,0,0,.25),0 0 22px rgba(0,0,0,.45)!important;background:transparent!important;pointer-events:none!important}" +
    "#frame-search-label{position:fixed!important;left:50%!important;top:18px!important;transform:translateX(-50%)!important;padding:9px 13px!important;border-radius:999px!important;color:#fff!important;background:rgba(15,15,18,.9)!important;font:600 13px system-ui,sans-serif!important;pointer-events:none!important;white-space:nowrap!important}";

  const overlay = document.createElement("div");
  overlay.id = "frame-search-overlay";
  const box = document.createElement("div");
  box.id = "frame-search-box";
  const label = document.createElement("div");
  label.id = "frame-search-label";
  label.textContent = "Drag to search with Lens • Esc to cancel";

  document.documentElement.append(style, overlay);
  overlay.append(box, label);

  let startX = 0, startY = 0, dragging = false;

  function cleanup() {
    overlay.remove();
    style.remove();
    window.__frameSearchSelector = false;
  }

  function update(x, y) {
    box.style.left = Math.min(startX, x) + "px";
    box.style.top = Math.min(startY, y) + "px";
    box.style.width = Math.abs(x - startX) + "px";
    box.style.height = Math.abs(y - startY) + "px";
  }

  overlay.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    overlay.setPointerCapture(e.pointerId);
    update(startX, startY);
  });

  overlay.addEventListener("pointermove", e => {
    if (dragging) update(e.clientX, e.clientY);
  });

  overlay.addEventListener("pointerup", e => {
    if (!dragging) return;
    dragging = false;
    const width = Math.abs(e.clientX - startX);
    const height = Math.abs(e.clientY - startY);
    if (width < 8 || height < 8) {
      cleanup();
      return;
    }
    chrome.runtime.sendMessage({
      type: "select-region",
      rect: {
        x: Math.min(startX, e.clientX),
        y: Math.min(startY, e.clientY),
        width,
        height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      }
    });
    cleanup();
  });

  function cancel(e) {
    if (e.key === "Escape") {
      chrome.runtime.sendMessage({ type: "cancel-region" });
      cleanup();
    }
  }
  window.addEventListener("keydown", cancel, { once: true });
})();