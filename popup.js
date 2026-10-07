const status = document.getElementById("status");
document.getElementById("capture").onclick = () => start("full");
document.getElementById("region").onclick = () => start("region");

async function start(mode) {
  status.textContent = mode === "region" ? "Choose an area on the page…" : "Capturing…";
  try {
    await chrome.runtime.sendMessage({ type: "capture-now", mode });
    if (mode === "region") window.close();
  } catch (e) {
    status.textContent = e.message || "Something went wrong.";
  }
}