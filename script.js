let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chartPie = null,
  chartBar = null,
  chartLine = null;
let editingId = null;

render();

// === ДОБАВИТЬ ТРАНЗАКЦИЮ ===
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
}

// === РЕДАКТИРОВАНИЕ, УДАЛЕНИЕ, ОЧИСТКА ===
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

  if (!title || isNaN(amount) || amount <= 0) return alert("Ошибка");

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

function deleteTransaction(id) {
  if (confirm("Удалить?")) {
    transactions = transactions.filter((t) => t.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    render();
  }
}

function clearAll() {
  if (confirm("Удалить ВСЁ?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    render();
  }
}

// === ФИЛЬТР ===
function filterData() {
  const filter = document.getElementById("filter").value;
  const search = document.getElementById("searchBox").value.toLowerCase();
  const today = new Date();

  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      let ok = true;
      if (filter === "today") ok = d.toDateString() === today.toDateString();
      if (filter === "month")
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

// === РЕНДЕР ===
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

// === ДИАГРАММЫ (РАБОТАЮТ ОФФЛАЙН) ===
function drawCharts(data) {
  // Круговая
  const cats = {};
  data.forEach((t) => {
    if (t.type === "expense")
      cats[t.category] = (cats[t.category] || 0) + t.amount;
  });

  const ctxPie = document.getElementById("chart").getContext("2d");
  if (chartPie) chartPie.destroy();
  chartPie = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: Object.keys(cats).length ? Object.keys(cats) : ["Нет расходов"],
      datasets: [
        {
          data: Object.keys(cats).length ? Object.values(cats) : [1],
          backgroundColor: Object.keys(cats).length
            ? ["#e74c3c", "#3498db", "#f39c12", "#27ae60", "#9b59b6"]
            : ["#ecf0f1"],
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });

  // Остальные диаграммы — аналогично (твой код)
  // ... (вставь свои chartBar и chartLine)
}

// === CSV ===
function exportCSV() {
  /* твой код */
}
function importCSV(e) {
  /* твой код с фиксом кавычек */
}

window.onclick = (e) => {
  if (e.target === document.getElementById("editModal")) closeModal();
};
