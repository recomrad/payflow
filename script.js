const tableBody = document.querySelector("#peopleTable tbody");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");

let people = [];
let focusState = null;

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

function applyRounding(transactions) {
    const mode = document.getElementById("roundMode").value;

    return transactions.map(t => {
        let amount = t.amount;

        switch (mode) {
            case "ceil":
                amount = Math.ceil(amount);
                break;

            case "nearest":
                amount = Math.round(amount);
                break;

            case "10":
                amount = Math.ceil(amount / 10) * 10;
                break;

            case "100":
                amount = Math.ceil(amount / 100) * 100;
                break;

            case "none":
            default:
                break;
        }

        return {
            ...t,
            amount
        };
    });
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

    return applyRounding(result);
}

function render() {
    const active = document.activeElement;
    
    if (active && (active.tagName === "INPUT")) {
        focusState = {
            index: [...tableBody.querySelectorAll("input")].indexOf(active),
            value: active.value,
            selectionStart: active.selectionStart,
            selectionEnd: active.selectionEnd
        };
    } else {
        focusState = null;
    }
    
    tableBody.innerHTML = "";

    const transactions = computeAllTransactions();

    document.getElementById("count").innerText = `Участников: ${people.length}`;

    people.forEach((p, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="index">${i + 1}</td>
            <td><input value="${p.name}" onchange="update(${i}, 'name', this.value)"></td>
            <td><input 
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                value="${formatNumber(p.paid)}"
                onfocus="this.value = ${p.paid}"
                oninput="onAmountInput(this)"
                onblur="onAmountBlur(${i}, this)"
            ></td>
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

    if (focusState) {
        const inputs = tableBody.querySelectorAll("input");
        
        const el = inputs[focusState.index];
        if (el) {
            el.focus();
            
            if (el.type === "text" || el.type === "number") {
                el.setSelectionRange(
                    focusState.selectionStart,
                    focusState.selectionEnd
                );
            }
        }
    }
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

function parseNumber(value) {
    if (!value) return 0;

    // убираем всё кроме цифр
    const cleaned = value.toString().replace(/[^\d]/g, "");

    return parseInt(cleaned, 10) || 0;
}

function formatNumber(value) {
    if (!value) return "0";
    return Number(value).toLocaleString("ru-RU");
}

function onAmountBlur(index, el) {
    const value = parseNumber(el.value);

    people[index].paid = value;

    el.value = formatNumber(value);

    render();
}

function onAmountInput(el) {
    // разрешаем только цифры
    el.value = el.value.replace(/[^\d]/g, "");
}

saveBtn.onclick = () => {
    try {
        localStorage.setItem("debtsData", encodeData(people));
        localStorage.setItem("roundMode", document.getElementById("roundMode").value);

        showToast("Сохранено");
    } catch (e) {
        console.error(e);
        alert("Ошибка сохранения");
    }
};

function load() {
    const saved = localStorage.getItem("debtsData");
    if (saved) {
        try {
            people = decodeData(saved);
        } catch {
            people = [];
        }
    }

    const savedMode = localStorage.getItem("roundMode");
    if (savedMode) {
        document.getElementById("roundMode").value = savedMode;
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

document.getElementById("roundMode").onchange = () => {
    localStorage.setItem("roundMode", document.getElementById("roundMode").value);
    render();
};

addBtn.onclick = () => addPerson();

load();
render();
