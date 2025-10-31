let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chartPie, chartBar;

// === ЭМОДЗИ ПО КАТЕГОРИЯМ ===
function getCategoryEmoji(category) {
  const emojis = {
    Еда: "🍎",
    Транспорт: "🚌",
    Жильё: "🏠",
    Покупки: "🛍️",
    Развлечения: "🎬",
    Коммунальные: "💡",
    Здоровье: "🏥",
    Учёба: "📚",
    Путешествия: "✈️",
    Прочее: "🤷",
  };
  // Возвращаем эмодзи + название категории
  return (emojis[category] || "🤷") + ` ${category}`;
}

// === СОХРАНЕНИЕ ===
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// === ДОБАВЛЕНИЕ ===
function addTransaction() {
  const title = document.getElementById("title").value.trim();
  // Используем Number() вместо parseFloat() для большей точности
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  // Более надёжный способ получения текущей даты
  const date =
    document.getElementById("date").value ||
    new Date().toISOString().slice(0, 10);

  if (!title || !amount || isNaN(amount) || amount <= 0) {
    alert("Введите название и корректную положительную сумму!");
    return;
  }

  transactions.push({ id: Date.now(), title, amount, type, category, date });
  saveData();
  clearInputs();
  render();
}

function clearInputs() {
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  // Сброс поля даты на пустое после добавления транзакции (опционально)
  document.getElementById("date").value = "";
}

// === УДАЛЕНИЕ ===
function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  render();
}

function clearAll() {
  if (
    confirm(
      "ВНИМАНИЕ! Вы уверены, что хотите удалить ВСЕ данные? Это действие необратимо."
    )
  ) {
    transactions = [];
    saveData();
    render();
  }
}

// === ФИЛЬТРАЦИЯ ===
function getFilteredTransactions() {
  const filter = document.getElementById("filter").value;
  const search = document.getElementById("searchBox").value.toLowerCase();
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter((t) => {
    // Улучшенная проверка: ищет в названии, категории ИЛИ сумме
    const matchSearch =
      t.title.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search) ||
      t.amount.toString().includes(search);

    if (!matchSearch) return false;

    if (filter === "today") {
      return t.date === todayISO;
    } else if (filter === "month") {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    return true; // "all"
  });
}

// === ОТРИСОВКА ===
function render() {
  const list = document.getElementById("list");
  const filtered = getFilteredTransactions();
  list.innerHTML = "";

  let balance = 0;

  filtered.forEach((t) => {
    const row = document.createElement("tr");
    // Эмодзи и название категории теперь в одной ячейке
    const categoryDisplay = getCategoryEmoji(t.category);
    const sign = t.type === "income" ? "+" : "-";

    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.title}</td>
      <td>${categoryDisplay}</td> 
      <td class="${t.type}">${sign}${t.amount.toFixed(2)} ₽</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${
        t.id
      })">🗑️</button></td>
    `;
    list.appendChild(row);
    balance += t.type === "income" ? t.amount : -t.amount;
  });

  document.getElementById("balance").textContent = `Баланс: ${balance.toFixed(
    2
  )} ₽`;
  renderCharts(filtered);
}

// === ГРАФИКИ ===
function renderCharts(data) {
  // Уничтожение старых графиков перед перерисовкой
  if (chartPie) chartPie.destroy();
  if (chartBar) chartBar.destroy();

  const ctxPie = document.getElementById("chart");
  const ctxBar = document.getElementById("chartBar");

  if (!ctxPie || !ctxBar) return;

  // Круговая диаграмма (Расходы)
  const expenseCategories = {};
  data
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      // Суммы округляются, чтобы избежать проблем с плавающей точкой
      expenseCategories[t.category] =
        (expenseCategories[t.category] || 0) + t.amount;
    });

  const chartContainerPie = ctxPie.parentElement;

  if (Object.keys(expenseCategories).length) {
    // Восстанавливаем оригинальный canvas, если он был заменен текстом
    if (chartContainerPie.querySelector("p")) {
      chartContainerPie.innerHTML =
        '<canvas id="chart" width="400" height="300"></canvas>';
    }
    const labels = Object.keys(expenseCategories).map(getCategoryEmoji);

    chartPie = new Chart(ctxPie, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: Object.values(expenseCategories).map((val) =>
              Number(val.toFixed(2))
            ), // Округление для данных
            // Расширенная палитра для большего числа категорий
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#A8DADC",
              "#457B9D",
              "#1D3557",
              "#2A9D8F",
              "#E9C46A",
              "#F4A261",
              "#E63946",
              "#F1FAEE",
              "#A8DADC",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  } else {
    // Если нет данных для расходов, очищаем контейнер (для пустого состояния)
    chartContainerPie.innerHTML =
      '<p style="text-align: center; color: #777;">Нет данных по расходам для выбранного фильтра.</p>';
  }

  // Столбчатая диаграмма (Доходы/Расходы по месяцам)
  const months = {};
  data.forEach((t) => {
    const d = new Date(t.date);
    // Ключ в формате YYYY-MM
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  // Сортировка по ключу (YYYY-MM)
  const sortedKeys = Object.keys(months).sort();
  const sortedMonths = {};
  sortedKeys.forEach((k) => (sortedMonths[k] = months[k]));

  const chartContainerBar = ctxBar.parentElement;

  if (Object.keys(sortedMonths).length) {
    // Восстанавливаем оригинальный canvas, если он был заменен текстом
    if (chartContainerBar.querySelector("p")) {
      chartContainerBar.innerHTML =
        '<canvas id="chartBar" width="400" height="300"></canvas>';
    }
    // Преобразование ключей YYYY-MM в удобочитаемый формат (например, 03/2025)
    const formattedLabels = sortedKeys.map((key) => {
      const [year, month] = key.split("-");
      return `${month}/${year}`;
    });

    chartBar = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: "Доходы",
            data: Object.values(sortedMonths).map((m) =>
              Number(m.income.toFixed(2))
            ),
            backgroundColor: "#36A2EB",
          },
          {
            label: "Расходы",
            data: Object.values(sortedMonths).map((m) =>
              Number(m.expense.toFixed(2))
            ),
            backgroundColor: "#FF6384",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { position: "bottom" } },
      },
    });
  } else {
    // Если нет данных для столбчатой диаграммы
    chartContainerBar.innerHTML =
      '<p style="text-align: center; color: #777;">Нет данных для отображения гистограммы.</p>';
  }
}

// ... (Ваш код до этого места)

// === PWA УСТАНОВКА ===
let deferredPrompt;
const installContainer = document.getElementById("installContainer");
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Показываем кнопку, как только браузер разрешает установку
  installContainer.style.display = "block";
  console.log("PWA: Событие 'beforeinstallprompt' сработало.");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) {
    alert("Установка недоступна. Попробуйте обновить страницу.");
    return;
  }

  installContainer.style.display = "none";
  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    console.log("PWA: Пользователь принял установку.");
  }
  deferredPrompt = null;
});

// Если приложение установили, скрываем кнопку
window.addEventListener("appinstalled", () => {
  installContainer.style.display = "none";
  console.log("PWA: Приложение успешно установлено.");
});

// === SERVICE WORKER ===
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // 🔥 Окончательно проверено: имя service-worker.js
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) =>
        console.log("SW: Успешно зарегистрирован! Область: ", reg.scope)
      )
      .catch((err) => console.error("SW: Ошибка регистрации:", err));
  });
}

// === СТАРТ ===
document.addEventListener("DOMContentLoaded", render);
