let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chartPie, chartBar;

function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function addTransaction() {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date =
    document.getElementById("date").value ||
    new Date().toISOString().slice(0, 10);

  if (!title || !amount) {
    alert("Введите название и сумму!");
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
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  render();
}

function clearAll() {
  if (confirm("Удалить все данные?")) {
    transactions = [];
    saveData();
    render();
  }
}

function getFilteredTransactions() {
  const filter = document.getElementById("filter").value;
  const search = document.getElementById("searchBox").value.toLowerCase();
  const now = new Date();

  return transactions.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search);

    if (filter === "today") {
      return matchSearch && t.date === now.toISOString().slice(0, 10);
    } else if (filter === "month") {
      const [year, month] = [now.getFullYear(), now.getMonth()];
      const d = new Date(t.date);
      return matchSearch && d.getFullYear() === year && d.getMonth() === month;
    }
    return matchSearch;
  });
}

function render() {
  const list = document.getElementById("list");
  const filtered = getFilteredTransactions();
  list.innerHTML = "";

  let balance = 0;

  filtered.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.title}</td>
      <td>${t.category}</td>
      <td class="${t.type}">${t.type === "income" ? "+" : "-"}${t.amount} ₽</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${
        t.id
      })">✖</button></td>
    `;
    list.appendChild(row);

    balance += t.type === "income" ? t.amount : -t.amount;
  });

  document.getElementById("balance").textContent = `Баланс: ${balance.toFixed(
    2
  )} ₽`;

  renderCharts(filtered);
}

function renderCharts(data) {
  // ✅ Уничтожаем старые графики, чтобы не дублировались
  if (chartPie) chartPie.destroy();
  if (chartBar) chartBar.destroy();

  const ctxPie = document.getElementById("chart");
  const ctxBar = document.getElementById("chartBar");

  if (!ctxPie || !ctxBar) return;

  // --- Диаграмма расходов по категориям ---
  const categories = {};
  data
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

  if (Object.keys(categories).length) {
    chartPie = new Chart(ctxPie, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#B0E57C",
              "#F778A1",
              "#C71585",
              "#4682B4",
              "#FFD700",
              "#8B0000",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // --- Диаграмма доходов/расходов по месяцам ---
  const months = {};
  data.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  if (Object.keys(months).length) {
    chartBar = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: Object.keys(months),
        datasets: [
          {
            label: "Доходы",
            data: Object.values(months).map((m) => m.income),
            backgroundColor: "#36A2EB",
          },
          {
            label: "Расходы",
            data: Object.values(months).map((m) => m.expense),
            backgroundColor: "#FF6384",
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { position: "bottom" } },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", render);
