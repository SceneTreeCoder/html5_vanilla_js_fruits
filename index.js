document.addEventListener("DOMContentLoaded", main);

const SELECTED_CHANCE = 0.11;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function ensureStyles() {
  if (document.getElementById("fruit-list-styles")) return;

  const style = document.createElement("style");
  style.id = "fruit-list-styles";
  style.textContent = `
    .fruit-list {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      width: 100%;
      max-width: 560px;
      margin: 24px 0 0;
      padding: 0;
    }

    .fruit-list li {
      padding: 8px 12px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 1.125rem;
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s, color 0.15s, box-shadow 0.15s;
    }

    .fruit-list li:hover {
      background: #e2e8f0;
    }

    .fruit-list li.clsSelected {
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 6px 16px rgba(30, 58, 138, 0.35);
    }

    .fruit-list li.clsSelected:hover {
      background: #1e40af;
    }

    .fruit-list li.clsNeedsCheck {
      outline: 3px dashed #16a34a;
      outline-offset: 2px;
    }

    .fruit-list li.clsNeedsUncheck {
      outline: 3px dashed #dc2626;
      outline-offset: 2px;
    }

    .fruit-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 24px;
    }

    .fruit-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #1e3a8a;
      color: #ffffff;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }

    .fruit-actions button:hover {
      background: #1e40af;
    }

    .fruit-actions button:active {
      transform: translateY(1px);
    }

    .layer {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.55);
      z-index: 1000;
    }

    .layer-panel {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: min(480px, 100%);
      padding: 24px;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.25);
    }

    .layer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .layer-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .layer-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }

    .layer-close:hover {
      background: #e2e8f0;
    }

    .layer-textarea {
      box-sizing: border-box;
      width: 100%;
      min-height: 160px;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #0f172a;
      font: 1rem/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      resize: vertical;
    }

    .layer-textarea:focus {
      outline: 3px solid #38bdf8;
      outline-offset: 2px;
    }

    .layer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .layer-button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #1e3a8a;
      color: #ffffff;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }

    .layer-button:hover {
      background: #1e40af;
    }

    .layer-message {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .diff-row {
      padding: 8px 12px;
      border-radius: 8px;
    }

    .diff-check {
      background: #dcfce7;
      color: #166534;
    }

    .diff-uncheck {
      background: #fee2e2;
      color: #991b1b;
    }

    .diff-unknown {
      background: #fef3c7;
      color: #92400e;
    }
  `;
  document.head.appendChild(style);
}

function renderFruits(fruits) {
  const list = document.createElement("ul");
  list.className = "fruit-list";

  for (const fruit of fruits) {
    const item = document.createElement("li");
    item.textContent = `${fruit.name} (${fruit.id})`;
    item.dataset.id = String(fruit.id);
    item.dataset.name = fruit.name;

    if (Math.random() < SELECTED_CHANCE) {
      item.classList.add("clsSelected");
    }

    item.addEventListener("click", () => {
      item.classList.toggle("clsSelected");
    });

    list.appendChild(item);
  }

  return list;
}

function sortList(list, key, direction) {
  const items = [...list.children];
  const factor = direction === "asc" ? 1 : -1;

  items.sort((a, b) =>
    factor *
    (key === "id"
      ? Number(a.dataset.id) - Number(b.dataset.id)
      : a.dataset.name.localeCompare(b.dataset.name))
  );

  list.append(...items);
}

function getSelectedIds(list) {
  return [...list.querySelectorAll("li.clsSelected")]
    .map((item) => Number(item.dataset.id))
    .sort((a, b) => a - b);
}

function closeLayer() {
  const layer = document.getElementById("layer");
  if (layer) {
    layer.remove();
  }
  document
    .querySelectorAll(".clsNeedsCheck, .clsNeedsUncheck")
    .forEach((item) => item.classList.remove("clsNeedsCheck", "clsNeedsUncheck"));
  document.removeEventListener("keydown", onLayerKeydown);
}

function onLayerKeydown(event) {
  if (event.key === "Escape") {
    closeLayer();
  }
}

function openLayer(title, buildContent) {
  closeLayer();

  const layer = document.createElement("div");
  layer.className = "layer";
  layer.id = "layer";
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  layer.addEventListener("click", (event) => {
    if (event.target === layer) {
      closeLayer();
    }
  });

  const panel = document.createElement("div");
  panel.className = "layer-panel";

  const header = document.createElement("div");
  header.className = "layer-header";

  const heading = document.createElement("h2");
  heading.className = "layer-title";
  heading.textContent = title;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "layer-close";
  close.setAttribute("aria-label", "Close");
  close.textContent = "×";
  close.addEventListener("click", closeLayer);

  header.append(heading, close);
  panel.append(header, ...buildContent());

  layer.appendChild(panel);
  document.body.appendChild(layer);
  document.addEventListener("keydown", onLayerKeydown);

  return layer;
}

function appendDiffRow(container, label, ids, className) {
  const row = document.createElement("div");
  row.className = `diff-row ${className}`;
  row.textContent = `${label}: ${ids.length ? ids.join(", ") : "none"}`;
  container.appendChild(row);
}

function renderActions(list, label, adjectives, animals) {
  const actions = document.createElement("div");
  actions.className = "fruit-actions";

  const createSortButton = (key, labelText) => {
    const button = document.createElement("button");
    button.type = "button";

    let direction = "asc";
    const updateLabel = () => {
      button.textContent = `${labelText} ${direction === "asc" ? "^" : "v"}`;
    };

    updateLabel();
    button.addEventListener("click", () => {
      direction = direction === "asc" ? "desc" : "asc";
      updateLabel();
      sortList(list, key, direction);
    });

    return button;
  };

  const randomizeButton = document.createElement("button");
  randomizeButton.type = "button";
  randomizeButton.textContent = "🎲 randomize";
  randomizeButton.addEventListener("click", () => {
    label.textContent = `${randomItem(adjectives)} ${randomItem(animals)}`;

    for (const item of list.children) {
      item.classList.toggle("clsSelected", Math.random() < SELECTED_CHANCE);
    }
  });

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "export";
  exportButton.addEventListener("click", () => {
    const layer = openLayer("Export", () => {
      const textarea = document.createElement("textarea");
      textarea.className = "layer-textarea";
      textarea.readOnly = true;
      textarea.spellcheck = false;
      textarea.value = getSelectedIds(list).join("\n");
      return [textarea];
    });

    const textarea = layer.querySelector(".layer-textarea");
    textarea.focus();
    textarea.select();
  });

  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.textContent = "import";
  importButton.addEventListener("click", () => {
    const layer = openLayer("Import", () => {
      const textarea = document.createElement("textarea");
      textarea.className = "layer-textarea";
      textarea.spellcheck = false;
      textarea.placeholder = "Enter ids, one per line";

      const message = document.createElement("div");
      message.className = "layer-message";
      message.textContent = "Enter fruit ids and press compare.";

      const actionsRow = document.createElement("div");
      actionsRow.className = "layer-actions";

      const compare = document.createElement("button");
      compare.type = "button";
      compare.className = "layer-button";
      compare.textContent = "compare";
      compare.addEventListener("click", () => {
        const ids = [
          ...new Set(
            textarea.value
              .split(/[^0-9]+/)
              .filter(Boolean)
              .map(Number)
          ),
        ];

        message.replaceChildren();

        if (ids.length === 0) {
          message.textContent = "No ids entered.";
          return;
        }

        const items = [...list.children];
        const validIds = new Set(items.map((item) => Number(item.dataset.id)));
        const target = new Set(ids.filter((id) => validIds.has(id)));
        const unknown = ids.filter((id) => !validIds.has(id)).sort((a, b) => a - b);
        const selectedBefore = getSelectedIds(list);
        const toCheck = [...target]
          .filter((id) => !selectedBefore.includes(id))
          .sort((a, b) => a - b);
        const toUncheck = selectedBefore.filter((id) => !target.has(id));

        for (const item of items) {
          const id = Number(item.dataset.id);
          const shouldSelect = target.has(id);
          const wasSelected = item.classList.contains("clsSelected");

          item.classList.remove("clsNeedsCheck", "clsNeedsUncheck");
          item.classList.toggle("clsSelected", shouldSelect);

          if (shouldSelect && !wasSelected) {
            item.classList.add("clsNeedsCheck");
          } else if (!shouldSelect && wasSelected) {
            item.classList.add("clsNeedsUncheck");
          }
        }

        appendDiffRow(message, "Checked (were missing)", toCheck, "diff-check");
        appendDiffRow(message, "Unchecked (were extra)", toUncheck, "diff-uncheck");

        if (unknown.length) {
          appendDiffRow(message, "Unknown ids (ignored)", unknown, "diff-unknown");
        }

        if (!toCheck.length && !toUncheck.length && !unknown.length) {
          message.textContent = "Already in sync.";
        }
      });

      actionsRow.append(compare);
      return [textarea, message, actionsRow];
    });

    layer.querySelector(".layer-textarea").focus();
  });

  actions.append(
    createSortButton("id", "Sort by id"),
    createSortButton("name", "Sort by name"),
    randomizeButton,
    exportButton,
    importButton
  );
  return actions;
}

function render(adjectives, animals, fruits) {
  document.body.replaceChildren();
  ensureStyles();

  const page = document.createElement("div");
  Object.assign(page.style, {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "100vh",
    margin: "0",
    padding: "0",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    background: "#f8fafc",
  });

  const card = document.createElement("div");
  Object.assign(card.style, {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "800px",
    minHeight: "600px",
    padding: "40px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.08)",
  });

  const label = document.createElement("div");
  Object.assign(label.style, {
    boxSizing: "border-box",
    padding: "16px 32px",
    borderRadius: "16px",
    background: "#1e3a8a",
    color: "#ffffff",
    fontSize: "2rem",
    fontWeight: "600",
    lineHeight: "1.2",
    textAlign: "center",
  });
  label.textContent = `${randomItem(adjectives)} ${randomItem(animals)}`;

  const list = renderFruits(fruits);

  card.append(label, list, renderActions(list, label, adjectives, animals));
  page.appendChild(card);
  document.body.appendChild(page);
}

async function main() {
  document.body.style.margin = "0";

  try {
    const [adjectives, animals, fruits] = await Promise.all([
      loadJson("./adverbs.json"),
      loadJson("./animals.json"),
      loadJson("./fruits.json"),
    ]);

    console.log({ adjectives, animals, fruits });
    render(adjectives, animals, fruits);
  } catch (error) {
    console.error(error);
  }
}
