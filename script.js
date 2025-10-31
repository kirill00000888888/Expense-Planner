let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chartPie = null,
  chartBar = null,
  chartLine = null;
let editingId = null;
render();

function addTransaction() {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value || "Без категории";
  const date =
    document.getElementById("date").value ||
    new Date().toISOString().slice(0, 10);

  if (!title || isNaN(amount) || amount <= 0) {
    alert("Введите корректные данные");
    return;
  }

  transactions.push({ id: Date.now(), title, amount, type, category, date });
  localStorage.setItem("transactions", JSON.stringify(transactions));
  clearForm();
  render();
}

function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("date").value = "";
  document.getElementById("title").focus();
}

function deleteTransaction(id) {
  if (confirm("Удалить транзакцию?")) {
    transactions = transactions.filter((t) => t.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    render();
  }
}

function editTransaction(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;

  editingId = id;
  document.getElementById("editTitle").value = t.title;
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editType").value = t.type;
  document.getElementById("editCategory").value = t.category;
  document.getElementById("editDate").value = t.date;
  document.getElementById("editModal").style.display = "flex";
}

function saveEdit() {
  const title = document.getElementById("editTitle").value.trim();
  const amount = parseFloat(document.getElementById("editAmount").value);
  const type = document.getElementById("editType").value;
  const category =
    document.getElementById("editCategory").value || "Без категории";
  const date = document.getElementById("editDate").value;

  if (!title || isNaN(amount) || amount <= 0) {
    alert("Заполните все поля корректно");
    return;
  }

  const idx = transactions.findIndex((t) => t.id === editingId);
  if (idx !== -1) {
    transactions[idx] = { id: editingId, title, amount, type, category, date };
    localStorage.setItem("transactions", JSON.stringify(transactions));
    closeModal();
    render();
  }
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
  editingId = null;
}

function clearAll() {
  if (confirm("Удалить ВСЕ данные? Это нельзя отменить!")) {
    transactions = [];
    localStorage.removeItem("transactions");
    render();
  }
}

function filterData() {
  const filter = document.getElementById("filter").value;
  const search = document.getElementById("searchBox").value.toLowerCase();
  const today = new Date();

  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      let ok = true;
      if (filter === "today") ok = d.toDateString() === today.toDateString();
      else if (filter === "month")
        ok =
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear();
      const match =
        t.title.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search);
      return ok && match;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function render() {
  const data = filterData();
  const list = document.getElementById("list");
  list.innerHTML = "";

  let income = 0,
    expense = 0;
  data.forEach((t) => {
    const sign = t.type === "income" ? "+" : "-";
    const cls = t.type === "income" ? "income" : "expense";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.title}</td>
      <td>${t.category}</td>
      <td class="${cls}">${sign}${t.amount.toFixed(0)} ₽</td>
      <td class="actions">
        <button class="edit-btn" onclick="editTransaction(${
          t.id
        })">Ред.</button>
        <button class="delete-btn" onclick="deleteTransaction(${
          t.id
        })">×</button>
      </td>
    `;
    list.appendChild(row);
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  const total = income - expense;
  document.getElementById(
    "balance"
  ).innerHTML = `Баланс: <strong style="color:${
    total >= 0 ? "#27ae60" : "#e74c3c"
  }">${total.toFixed(0)} ₽</strong>`;
  document.getElementById(
    "summary"
  ).innerHTML = `Доходы: <span style="color:#27ae60">+${income.toFixed(
    0
  )}</span> ₽ | Расходы: <span style="color:#e74c3c">-${expense.toFixed(
    0
  )}</span> ₽`;

  drawCharts(data);
}

// 🔥 ИСПРАВЛЕННЫЕ ДИАГРАММЫ 🔥
function drawCharts(data) {
  // 1. Круговая диаграмма — Расходы по категориям
  const categories = {};
  data.forEach((t) => {
    if (t.type === "expense") {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });

  const ctxPie = document.getElementById("chart").getContext("2d");
  if (chartPie) chartPie.destroy();

  if (Object.keys(categories).length === 0) {
    chartPie = new Chart(ctxPie, {
      type: "pie",
      data: {
        labels: ["Нет расходов"],
        datasets: [{ data: [1], backgroundColor: ["#ecf0f1"] }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  } else {
    chartPie = new Chart(ctxPie, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              "#e74c3c",
              "#3498db",
              "#f39c12",
              "#27ae60",
              "#9b59b6",
              "#1abc9c",
              "#34495e",
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
  }

  // 2. Столбчатая диаграмма — Доходы/расходы по месяцам
  const months = {};
  data.forEach((t) => {
    const [year, month] = t.date.split("-");
    const key = `${year}-${month}`;
    months[key] = months[key] || { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  const monthLabels = Object.keys(months).sort();
  const incomeData = monthLabels.map((m) => months[m].income);
  const expenseData = monthLabels.map((m) => months[m].expense);

  const ctxBar = document.getElementById("chartBar").getContext("2d");
  if (chartBar) chartBar.destroy();

  chartBar = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: "Доходы",
          data: incomeData,
          backgroundColor: "rgba(41, 128, 185, 0.8)",
        },
        {
          label: "Расходы",
          data: expenseData,
          backgroundColor: "rgba(231, 76, 60, 0.8)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } },
    },
  });

  // 3. Линейная диаграмма — Тренд баланса
  const dailyBalance = {};
  let runningTotal = 0;

  // Все транзакции по хронологии
  [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((t) => {
      runningTotal += t.type === "income" ? t.amount : -t.amount;
      dailyBalance[t.date] = runningTotal;
    });

  const lineLabels = Object.keys(dailyBalance).sort();
  const lineData = lineLabels.map((date) => dailyBalance[date]);

  const ctxLine = document.getElementById("chartLine").getContext("2d");
  if (chartLine) chartLine.destroy();

  chartLine = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: lineLabels,
      datasets: [
        {
          label: "Баланс",
          data: lineData,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: false } },
    },
  });
}

// CSV
function exportCSV() {
  const headers = ["Дата", "Название", "Категория", "Тип", "Сумма"];
  const rows = transactions.map((t) => [
    t.date,
    t.title,
    t.category,
    t.type === "income" ? "Доход" : "Расход",
    t.amount,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budget_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result
      .trim()
      .split("\n")
      .map((l) => l.trim());
    if (lines.length < 2) return alert("Файл пустой");

    const newTransactions = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length < 5) continue;

      const [date, title, category, typeStr, amountStr] = cols;
      const amount = parseFloat(amountStr);
      if (!date || !title || isNaN(amount) || amount <= 0) continue;

      newTransactions.push({
        id: Date.now() + i,
        title,
        amount,
        type: typeStr === "Доход" ? "income" : "expense",
        category: category || "Без категории",
        date,
      });
    }

    if (newTransactions.length === 0) return alert("Нет валидных записей");

    if (confirm(`Импортировать ${newTransactions.length} записей?`)) {
      transactions = [...transactions, ...newTransactions];
      localStorage.setItem("transactions", JSON.stringify(transactions));
      render();
      alert("✅ Импорт завершён!");
    }
  };
  reader.readAsText(file, "UTF-8");
}

// Закрытие модалки по клику вне области
window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeModal();
  }
};
