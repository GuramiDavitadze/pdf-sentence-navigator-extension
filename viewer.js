

import * as pdfjsLib from "./lib/pdf.min.mjs";
import { SentenceNavigator } from "./sentence-navigator.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.min.mjs");

const els = {
  container: document.getElementById("pdf-container"),
  loading: document.getElementById("loading"),
  emptyState: document.getElementById("empty-state"),
  fileInput: document.getElementById("file-input"),
  fileName: document.getElementById("file-name"),
  counter: document.getElementById("sentence-counter"),
};

let navigator_ = null;

function setStatus(text) {
  els.counter.textContent = text;
}

function showLoading(isLoading) {
  els.loading.classList.toggle("hidden", !isLoading);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function renderPdf(arrayBuffer, label) {
  els.emptyState.classList.add("hidden");
  els.container.innerHTML = "";
  navigator_ = null;
  setStatus("წინადადება: —");
  showLoading(true);
  if (label) els.fileName.textContent = label;

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    const allSpans = [];
    const scale = 1.4;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const pageDiv = document.createElement("div");
      pageDiv.className = "page";
      pageDiv.style.width = `${viewport.width}px`;
      pageDiv.style.height = `${viewport.height}px`;

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      pageDiv.appendChild(canvas);

      const textLayerDiv = document.createElement("div");
      textLayerDiv.className = "textLayer";
      pageDiv.appendChild(textLayerDiv);

      els.container.appendChild(pageDiv);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const textContent = await page.getTextContent();
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      });
      await textLayer.render();

      const spans = Array.from(textLayerDiv.querySelectorAll("span"));
      allSpans.push(...spans);
    }

    navigator_ = new SentenceNavigator(allSpans);
    setStatus(`წინადადებები ნაპოვნია: ${navigator_.total} — დააჭირეთ Tab-ს`);
  } catch (err) {
    console.error(err);
    setStatus("შეცდომა დოკუმენტის ჩატვირთვისას");
    els.container.innerHTML =
      `<p style="color:white;max-width:600px;text-align:center">ვერ მოხერხდა PDF-ის ჩატვირთვა: ${escapeHtml(err.message || String(err))}</p>`;
  } finally {
    showLoading(false);
  }
}

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  renderPdf(buffer, file.name);
});

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Tab") return;
    if (!navigator_ || navigator_.total === 0) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.shiftKey) {
      navigator_.prev();
    } else {
      navigator_.next();
    }

    setStatus(`წინადადება ${navigator_.currentIndex + 1} / ${navigator_.total}`);
  },
  { capture: true }
);