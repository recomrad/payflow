const tableBody = document.querySelector("#peopleTable tbody");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");

let people = [];

function addPerson(data = { name: "", paid: 0, excluded: false }) {
    people.push(data);
    render();
}

function removePerson(index) {
    if (!confirm("Удалить?")) return;
    people.splice(index, 1);
    render();
}

function update(index, field, value) {
    if (field === "paid") value = parseFloat(value) || 0;
    people[index][field] = value;
    render();
}

function computeAllTransactions() {
    const totalPaid = people.reduce((s, p) => s + p.paid, 0);
    const payers = people.filter(p => !p.excluded);
    if (!payers.length) return [];

    const share = totalPaid / payers.length;

    let debtors = [];
    let creditors = [];

    people.forEach(p => {
        const balance = +(p.paid - (p.excluded ? 0 : share)).toFixed(2);

        if (balance < -0.01) {
            debtors.push({ name: p.name, amount: -balance });
        } else if (balance > 0.01) {
            creditors.push({ name: p.name, amount: balance });
        }
    });

    let result = [];

    // минимизация количества транзакций:
    // сортируем и "схлопываем" максимально крупные суммы
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    while (debtors.length && creditors.length) {
        let d = debtors[0];
        let c = creditors[0];

        let amount = Math.min(d.amount, c.amount);

        result.push({
            from: d.name,
            to: c.name,
            amount
        });

        d.amount -= amount;
        c.amount -= amount;

        if (d.amount < 0.01) debtors.shift();
        else debtors.sort((a, b) => b.amount - a.amount);

        if (c.amount < 0.01) creditors.shift();
        else creditors.sort((a, b) => b.amount - a.amount);
    }

    return result;
}

function render() {
    tableBody.innerHTML = "";

    const transactions = computeAllTransactions();

    document.getElementById("count").innerText = `Участников: ${people.length}`;

    people.forEach((p, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="index">${i + 1}</td>
            <td><input value="${p.name}" onchange="update(${i}, 'name', this.value)"></td>
            <td><input type="number" value="${p.paid}" onchange="update(${i}, 'paid', this.value)"></td>
            <td><input type="checkbox" ${p.excluded ? "checked" : ""} onchange="update(${i}, 'excluded', this.checked)"></td>
            <td><button onclick="removePerson(${i})">Удалить</button></td>
        `;

        tableBody.appendChild(row);

        // показываем ТОЛЬКО исходящие долги
        const myDebts = transactions.filter(t => t.from === p.name);

        const debtRow = document.createElement("tr");
        debtRow.className = "debts";

        debtRow.innerHTML = `
            <td colspan="4">
                ${
                    myDebts.length
                        ? myDebts.map(d => `→ ${d.to}: ${d.amount.toFixed(2)} ₽`).join("<br>")
                        : "—"
                }
            </td>
        `;

        tableBody.appendChild(debtRow);
    });
}

/*
  Фикс Unicode:
  btoa работает только с Latin1 → используем encodeURIComponent
*/
function encodeData(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeData(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

saveBtn.onclick = () => {
    try {
        localStorage.setItem("debtsData", encodeData(people));
        showToast("Сохранено");
    } catch (e) {
        console.error(e);
        alert("Ошибка сохранения");
    }
};

function load() {
    const saved = localStorage.getItem("debtsData");
    if (!saved) return;

    try {
        people = decodeData(saved);
    } catch {
        people = [];
    }
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");

    setTimeout(() => {
        t.classList.remove("show");
    }, 2000);
}



addBtn.onclick = () => addPerson();

load();
render();
