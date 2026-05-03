 (function () {
  const fileInput = document.getElementById("file");
  const dropzone = document.getElementById("dropzone");
  const fileNameEl = document.getElementById("file-name");
  const resetBtn = document.getElementById("reset");
  const loadingWrap = document.getElementById("loading");
  const loadingText = document.getElementById("loading-text");
  const errorEl = document.getElementById("error");
  const summaryProse = document.getElementById("summary");
  const flashcardsGrid = document.getElementById("flashcards-grid");
  const quizForm = document.getElementById("quiz-form");
  const submitQuizBtn = document.getElementById("submit-quiz");
  const regenerateQuizBtn = document.getElementById("regenerate-quiz");
  const quizScore = document.getElementById("quiz-score");
  const copyBtn = document.getElementById("copy");
  const summaryBtn = document.getElementById("generate-summary");
  const flashcardsBtn = document.getElementById("generate-flashcards");
  const quizBtn = document.getElementById("generate-quiz");
  const toast = document.getElementById("toast");
  const tabButtons = Array.from(document.querySelectorAll(".dock-tab"));
  const pages = Array.from(document.querySelectorAll(".page"));
  const themeToggle = document.getElementById("theme-toggle");
  const summaryEmpty = document.getElementById("summary-empty");
  const flashcardsEmpty = document.getElementById("flashcards-empty");
  const quizEmpty = document.getElementById("quiz-empty");
  let currentQuiz = [];

  function setFileName(name) {
    if (name) {
      fileNameEl.innerHTML = "Selected: <strong>" + escapeHtml(name) + "</strong>";
    } else {
      fileNameEl.textContent = "";
    }
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function setLoading(on) {
    summaryBtn.disabled = on;
    flashcardsBtn.disabled = on;
    quizBtn.disabled = on;
    regenerateQuizBtn.disabled = on;
    fileInput.disabled = on;
    loadingWrap.classList.toggle("is-visible", on);
    loadingWrap.setAttribute("aria-busy", on ? "true" : "false");
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("is-visible");
  }

  function hideError() {
    errorEl.classList.remove("is-visible");
  }

  function updateThemeLabel() {
    const dark = document.body.classList.contains("dark");
    themeToggle.textContent = dark ? "Light mode" : "Dark mode";
  }

  function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("lecture_theme", theme);
    updateThemeLabel();
  }

  function activateTab(tabId) {
    tabButtons.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.tab === tabId);
    });
    pages.forEach(function (page) {
      page.classList.toggle("is-active", page.id === tabId);
    });
  }

  function parseFlashcards(text) {
    const cards = [];
    const lines = text.split(/\r?\n/);
    let question = "";
    let answer = "";
    let mode = "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.toUpperCase().startsWith("Q:")) {
        if (question && answer) {
          cards.push({ question, answer });
        }
        question = line.slice(2).trim();
        answer = "";
        mode = "q";
      } else if (line.toUpperCase().startsWith("A:")) {
        answer = line.slice(2).trim();
        mode = "a";
      } else if (mode === "q") {
        question = (question + " " + line).trim();
      } else if (mode === "a") {
        answer = (answer + " " + line).trim();
      }
    }

    if (question && answer) {
      cards.push({ question, answer });
    }
    return cards;
  }

  function renderFlashcards(cards) {
    flashcardsGrid.innerHTML = "";
    if (!cards.length) {
      flashcardsEmpty.style.display = "block";
      return;
    }

    const frag = document.createDocumentFragment();

    cards.forEach(function (card) {
      const wrap = document.createElement("button");
      wrap.type = "button";
      wrap.className = "flashcard";
      wrap.setAttribute("aria-label", "Flip flashcard");

      const inner = document.createElement("div");
      inner.className = "flashcard-inner";

      const front = document.createElement("div");
      front.className = "flashcard-face front";
      front.innerHTML =
        '<span class="flashcard-label">Question</span><p class="flashcard-text">' +
        escapeHtml(card.question) +
        "</p>";

      const back = document.createElement("div");
      back.className = "flashcard-face back";
      back.innerHTML =
        '<span class="flashcard-label">Answer</span><p class="flashcard-text">' +
        escapeHtml(card.answer) +
        "</p>";

      inner.appendChild(front);
      inner.appendChild(back);
      wrap.appendChild(inner);
      wrap.addEventListener("click", function () {
        wrap.classList.toggle("is-flipped");
      });

      frag.appendChild(wrap);
    });

    flashcardsGrid.appendChild(frag);
    flashcardsEmpty.style.display = "none";
  }

  function parseQuiz(text) {
    const blocks = text.split(/\n\s*\n/);
    const quiz = [];
    for (const block of blocks) {
      const lines = block.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (!lines.length) continue;
      const qLine = lines.find(function (l) { return /^Q:/i.test(l); });
      if (!qLine) continue;
      const options = [];
      lines.forEach(function (line) {
        const m = line.match(/^([A-D])\)\s*(.+)$/i);
        if (m) {
          options.push({ key: m[1].toUpperCase(), text: m[2].trim() });
        }
      });
      const correctLine = lines.find(function (l) { return /^Correct:/i.test(l); });
      const correctMatch = correctLine ? correctLine.match(/^Correct:\s*([A-D])/i) : null;
      if (options.length === 4 && correctMatch) {
        quiz.push({
          question: qLine.replace(/^Q:\s*/i, "").trim(),
          options: options,
          correct: correctMatch[1].toUpperCase(),
        });
      }
    }
    return quiz.slice(0, 10);
  }

  function renderQuiz(quiz) {
    currentQuiz = quiz;
    quizForm.innerHTML = "";
    quizScore.classList.remove("is-visible");
    quizScore.textContent = "";
    if (!quiz.length) {
      quizEmpty.style.display = "block";
      return;
    }

    const frag = document.createDocumentFragment();
    quiz.forEach(function (item, idx) {
      const card = document.createElement("fieldset");
      card.className = "quiz-item";

      const q = document.createElement("legend");
      q.className = "quiz-question";
      q.textContent = (idx + 1) + ". " + item.question;
      card.appendChild(q);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "quiz-options";

      item.options.forEach(function (opt) {
        const label = document.createElement("label");
        label.className = "quiz-option";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quiz-q-" + idx;
        radio.value = opt.key;
        const txt = document.createElement("span");
        txt.textContent = opt.key + ") " + opt.text;
        label.appendChild(radio);
        label.appendChild(txt);
        optionsWrap.appendChild(label);
      });

      card.appendChild(optionsWrap);
      frag.appendChild(card);
    });

    quizForm.appendChild(frag);
    quizEmpty.style.display = "none";
  }

  function gradeQuiz() {
    if (!currentQuiz.length) return;
    let score = 0;
    currentQuiz.forEach(function (item, idx) {
      const picked = quizForm.querySelector('input[name="quiz-q-' + idx + '"]:checked');
      if (picked && picked.value === item.correct) {
        score++;
      }
    });
    quizScore.textContent = "Your mark: " + score + "/10";
    quizScore.classList.add("is-visible");
  }

  fileInput.addEventListener("change", function () {
    const f = fileInput.files[0];
    setFileName(f ? f.name : "");
    hideError();
  });

  let dragCount = 0;
  dropzone.addEventListener("dragenter", function (e) {
    e.preventDefault();
    dragCount++;
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", function (e) {
    e.preventDefault();
    dragCount--;
    if (dragCount === 0) dropzone.classList.remove("is-dragover");
  });
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dragCount = 0;
    dropzone.classList.remove("is-dragover");
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      fileInput.files = e.dataTransfer.files;
      setFileName(f.name);
      hideError();
    } else if (f) {
      showError("Please drop a PDF file.");
    }
  });

  function setLoadingText(mode) {
    const label =
      mode === "summary"
        ? "Generating summary..."
        : mode === "flashcards"
          ? "Generating flashcards..."
          : "Generating quiz...";
    loadingText.textContent = label;
  }

  async function runGeneration(mode) {
    hideError();
    const file = fileInput.files[0];
    if (!file) {
      showError("Choose a PDF file first.");
      return false;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showError("Only PDF files are supported.");
      return false;
    }

    setLoadingText(mode);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const endpoint =
        mode === "flashcards" ? "/flashcards" : mode === "quiz" ? "/quiz" : "/upload";
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      });
      const text = await res.text();
      if (!res.ok) {
        showError(text || "Something went wrong.");
        return;
      }
      if (text.trim().startsWith("AI error:")) {
        showError(text);
        return false;
      }

      if (mode === "flashcards") {
        renderFlashcards(parseFlashcards(text));
        activateTab("flashcards-page");
      } else if (mode === "quiz") {
        renderQuiz(parseQuiz(text));
        activateTab("quiz-page");
      } else {
        const html = typeof marked !== "undefined" && marked.parse
          ? marked.parse(text)
          : "<p>" + escapeHtml(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
        summaryProse.innerHTML = DOMPurify.sanitize(html);
        summaryEmpty.style.display = "none";
        activateTab("summary-page");
      }
      return true;
    } catch (err) {
      showError(err.message || "Network error. Try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  flashcardsBtn.addEventListener("click", async function () {
    await runGeneration("flashcards");
  });

  quizBtn.addEventListener("click", async function () {
    await runGeneration("quiz");
  });

  regenerateQuizBtn.addEventListener("click", async function () {
    await runGeneration("quiz");
  });

  submitQuizBtn.addEventListener("click", function () {
    gradeQuiz();
  });

  copyBtn.addEventListener("click", async function () {
    const text = summaryProse.innerText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.classList.add("is-visible");
      setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 2000);
    } catch {
      showError("Could not copy to clipboard.");
    }
  });

  resetBtn.addEventListener("click", function () {
    fileInput.value = "";
    setFileName("");
    summaryProse.innerHTML = "";
    flashcardsGrid.innerHTML = "";
    quizForm.innerHTML = "";
    quizScore.classList.remove("is-visible");
    quizScore.textContent = "";
    summaryEmpty.style.display = "block";
    flashcardsEmpty.style.display = "block";
    quizEmpty.style.display = "block";
    currentQuiz = [];
    hideError();
  });

  summaryBtn.addEventListener("click", async function () {
    await runGeneration("summary");
  });

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.dataset.tab);
    });
  });

  themeToggle.addEventListener("click", function () {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
  });

  const savedTheme = localStorage.getItem("lecture_theme");
  setTheme(savedTheme === "dark" ? "dark" : "light");
  activateTab("summary-page");
})();
