# Frame Search

Chrome Manifest V3 extension for sending real screenshots directly to Google Lens.

## Features

- **Ctrl + Shift + L** — capture the visible tab and search it with Google Lens
- **Ctrl + Shift + K** — drag-select a region and search that crop
- Right-click an image → **Frame Search — search image**
- Popup controls for full capture and region capture
- Adjustable screenshot JPEG quality
- High-DPI/device-pixel-ratio crop handling

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this repository folder
5. Use the extension's **Keyboard shortcuts** page to change shortcuts if desired

## How screenshot search works

Frame Search uses `chrome.tabs.captureVisibleTab`, then submits the captured JPEG as a real multipart `encoded_image` upload to Google's current Lens upload endpoint. This is different from `uploadbyurl`, which only works when an image is available at a public URL.

Google may change undocumented Lens upload behavior in the future.
