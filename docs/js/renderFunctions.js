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
            <td class="index">${String(i + 1).padStart(2, '0')}</td>
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
                ${myDebts.length ? myDebts.map(d => `→ ${d.to ? d.to : `<em class='unnamed'>Без имени (${people.find(p => p.id === d.toId)?.index || d.toId})</em>`} : ${d.amount.toFixed(2)} ₽`).join("<br>") : "—"}
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

function update(index, field, value) {
    if (field === "paid") value = parseFloat(value) || 0;
    people[index][field] = value;
    render();
}