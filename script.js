let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chartPie = null;
let chartBar = null;
render();

function addTransaction() {
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category =
    document.getElementById("category").value.trim() || "Без категории";
  const date =
    document.getElementById("date").value ||
    new Date().toISOString().slice(0, 10);

  if (!title || isNaN(amount)) {
    alert("Введите корректные данные");
    return;
  }

  transactions.push({ id: Date.now(), title, amount, type, category, date });
  localStorage.setItem("transactions", JSON.stringify(transactions));

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";

  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  render();
}

function clearAll() {
  if (confirm("Очистить все данные?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    render();
  }
}

function filterData() {
  const filter = document.getElementById("filter").value;
  const today = new Date();
  const search = document.getElementById("searchBox").value.toLowerCase();

  return transactions.filter((t) => {
    const d = new Date(t.date);
    let ok = true;

    if (filter === "today") {
      ok = d.toDateString() === today.toDateString();
    } else if (filter === "month") {
      ok =
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    }

    const matchSearch =
      t.title.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search);

    return ok && matchSearch;
  });
}

function render() {
  const data = filterData();
  const list = document.getElementById("list");
  list.innerHTML = "";

  let total = 0;
  data.forEach((t) => {
    const row = document.createElement("tr");
    const sign = t.type === "income" ? "+" : "-";
    const cls = t.type === "income" ? "income" : "expense";
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.title}</td>
      <td>${t.category}</td>
      <td class="${cls}">${sign}${t.amount} ₽</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button></td>
    `;
    list.appendChild(row);

    total += t.type === "income" ? t.amount : -t.amount;
  });

  const balance = document.getElementById("balance");
  balance.textContent = `Баланс: ${total.toFixed(2)} ₽`;
  balance.style.color = total >= 0 ? "green" : "crimson";

  drawCharts(data);
}

function drawCharts(data) {
  // 1️⃣ Pie chart — Расходы по категориям (ИСПРАВЛЕНО!)
  const categories = {};
  data.forEach((t) => {
    if (t.type === "expense") {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });

  const ctxPie = document.getElementById("chart").getContext("2d");
  if (chartPie) chartPie.destroy();

  // 🔥 ИСПРАВЛЕНИЕ: если нет расходов, показываем пустую диаграмму с текстом
  let pieData, pieOptions;
  if (Object.keys(categories).length === 0) {
    pieData = {
      labels: ["Нет данных"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["#f8f9fa"],
          borderWidth: 0,
        },
      ],
    };
    pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: { enabled: false },
        title: {
          display: true,
          text: "Нет расходов",
        },
      },
    };
  } else {
    pieData = {
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
          ],
        },
      ],
    };
    pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    };
  }

  chartPie = new Chart(ctxPie, {
    type: "pie",
    data: pieData,
    options: pieOptions,
  });

  // 2️⃣ Bar chart — без изменений (он работал)
  const months = {};
  data.forEach((t) => {
    const [year, month] = t.date.split("-");
    const key = `${year}-${month}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  const labels = Object.keys(months).sort();
  const incomeData = labels.map((m) => months[m].income);
  const expenseData = labels.map((m) => months[m].expense);

  const ctxBar = document.getElementById("chartBar").getContext("2d");
  if (chartBar) chartBar.destroy();

  chartBar = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Доходы",
          data: incomeData,
          backgroundColor: "rgba(75,192,192,0.7)",
        },
        {
          label: "Расходы",
          data: expenseData,
          backgroundColor: "rgba(255,99,132,0.7)",
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
}
