const status = document.getElementById("status");

(async () => {
  try {
    const { frameSearchCapture } = await chrome.storage.local.get("frameSearchCapture");
    if (!frameSearchCapture?.dataUrl) throw new Error("No capture found.");

    status.textContent = "Preparing screenshot…";
    const blob = dataUrlToBlob(frameSearchCapture.dataUrl);
    const finalBlob = frameSearchCapture.crop
      ? await cropBlob(blob, frameSearchCapture.crop)
      : blob;

    const file = new File([finalBlob], "frame.jpg", { type: "image/jpeg" });
    const input = document.createElement("input");
    input.type = "file";
    input.name = "encoded_image";
    input.accept = "image/jpeg,image/png,image/webp";

    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;

    const form = document.createElement("form");
    form.method = "POST";
    form.enctype = "multipart/form-data";
    form.action = "https://lens.google.com/v3/upload?ep=ccm&s=&st=" + Date.now();
    form.style.display = "none";

    const source = document.createElement("input");
    source.type = "hidden";
    source.name = "sbisrc";
    source.value = "Google Chrome";

    const dimensions = document.createElement("input");
    dimensions.type = "hidden";
    dimensions.name = "processed_image_dimensions";
    dimensions.value = finalBlob.size + "x1";

    form.append(input, source, dimensions);
    document.body.appendChild(form);
    status.textContent = "Opening Lens results…";
    await chrome.storage.local.remove("frameSearchCapture");
    form.submit();
  } catch (error) {
    status.textContent = error.message || "Upload failed.";
    document.querySelector(".spinner").style.display = "none";
  }
})();

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = (header.match(/:(.*?);/) || [, "image/jpeg"])[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function cropBlob(blob, crop) {
  const image = await createImageBitmap(blob);
  const sx = image.width / crop.viewport.width;
  const sy = image.height / crop.viewport.height;
  const x = Math.max(0, Math.round(crop.rect.x * sx));
  const y = Math.max(0, Math.round(crop.rect.y * sy));
  const width = Math.min(image.width - x, Math.round(crop.rect.width * sx));
  const height = Math.min(image.height - y, Math.round(crop.rect.height * sy));
  if (width < 2 || height < 2) return blob;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, x, y, width, height, 0, 0, width, height);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.94));
}