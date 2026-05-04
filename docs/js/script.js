const tableBody = document.querySelector("#peopleTable tbody");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");

let people = [];
let focusState = null;

function createId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Math.floor(Date.now()) + Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000));
}

function addPerson(data = { name: "", paid: 0, excluded: false }) {
    people.push({
        id: createId(),
        ...data
    });
    render();
}

function removePerson(index) {
    if (!confirm(`Удалить информацию об участнике ${people[index].name}?`)) return;
    people.splice(index, 1);
    render();
}

function update(index, field, value) {
    if (field === "paid") value = parseFloat(value) || 0;
    people[index][field] = value;
    render();
}
function onAmountKeyDown(e, index, el) {
    // TAB обрабатываем отдельно
    if (handleTabNavigation(e, el)) return;

    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

    e.preventDefault();

    let value = parseNumber(el.value);

    let step = 10;
    if (e.shiftKey) step = 100;
    if (e.ctrlKey) step = 1000;

    if (e.key === "ArrowUp") value += step;
    if (e.key === "ArrowDown") value = Math.max(0, value - step);

    people[index].paid = value;
    el.value = value;
}
function applyRounding(transactions) {
    const mode = document.getElementById("roundMode").value;

    return transactions.map(t => {
        let amount = t.amount;

        switch (mode) {
            case "ceil":
                amount = Math.ceil(amount);
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

    /*let debtors = [];
    let creditors = [];

    people.forEach(p => {
        const balance = +(p.paid - (p.excluded ? 0 : share)).toFixed(2);

        if (balance < -0.01) {
            debtors.push({ name: p.name, amount: -balance });
        } else if (balance > 0.01) {
            creditors.push({ name: p.name, amount: balance });
        }
    });*/

    let balances = people.map(p => ({
        id: p.id,
        name: p.name,
        balance: +(p.paid - (p.excluded ? 0 : share)).toFixed(2)
    })).filter(b => Math.abs(b.balance) > 0.01);

    let result = [];

    balances.sort((a, b) => a.balance - b.balance);

    let debtors = balances.filter(b => b.balance < 0);
    let creditors = balances.filter(b => b.balance > 0);

    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    while (debtors.length && creditors.length) {
        let d = debtors[0];
        let c = creditors[0];

        let amount = Math.min(d.amount ?? -d.balance, c.amount ?? c.balance);

        result.push({
            fromId: d.id,
            toId: c.id,
            from: d.name,
            to: c.name,
            amount
        });

        d.balance += amount;
        c.balance -= amount;

        if (Math.abs(d.balance) < 0.01) debtors.shift();
        if (Math.abs(c.balance) < 0.01) creditors.shift();
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
            <td class="index">${String(i + 1).padStart(2, '0') }</td>
            <td><input id="name-input-${i}" value="${p.name}" onchange="update(${i}, 'name', this.value)" placeholder="${p.id}"></td>
            <td><input id="paid-input-${i}"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                value="${formatNumber(p.paid)}"
                onfocus="this.value = ${p.paid}"
                oninput="onAmountInput(this)"
                onblur="onAmountBlur(${i}, this)"
                onkeydown="onAmountKeyDown(event, ${i}, this)"
            ></td>
            <td class='excludedItem'><input id="excluded-input-${i}" type="checkbox" ${p.excluded ? "checked" : ""} onchange="update(${i}, 'excluded', this.checked)"></td>
            <td><button id="remove-btn-${i}" onclick="removePerson(${i})">Удалить</button></td>
        `;

        tableBody.appendChild(row);

        // показываем ТОЛЬКО исходящие долги
        const myDebts = transactions.filter(t => t.fromId === p.id);

        const debtRow = document.createElement("tr");
        debtRow.className = "debts";

        debtRow.innerHTML = `
            <td colspan="5">
                ${myDebts.length ? myDebts.map(d => `→ ${d.to ? d.to : `<em class='unnamed'>unnamed-${people.find(p => p.id === d.toId)?.index || d.toId}</em>`} : ${d.amount.toFixed(2)} ₽`).join("<br>") : "—"}
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

    if (window._nextFocusIndex !== undefined) {
        const inputs = document.querySelectorAll("input");

        const el = inputs[window._nextFocusIndex];
        if (el) el.focus();

        window._nextFocusIndex = undefined;
    }
}

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
    return Number(value).toLocaleString("ru-RU") + " ₽";
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

function handleTabNavigation(e, el) {
    if (e.key !== "Tab") return false;

    const inputs = [...document.querySelectorAll("input")];
    const index = inputs.indexOf(el);

    let nextIndex;

    if (e.shiftKey) {
        nextIndex = index > 0 ? index - 1 : inputs.length - 1;
    } else {
        nextIndex = index < inputs.length - 1 ? index + 1 : 0;
    }

    window._nextFocusIndex = nextIndex;

    return true;
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
            const parsed = decodeData(saved);

            people = parsed.map(p => ({
                id: p.id || createId(),
                name: p.name,
                paid: p.paid,
                excluded: p.excluded
            }));
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
