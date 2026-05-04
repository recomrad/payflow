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

function onAmountInput(el) {
    // разрешаем только цифры
    el.value = el.value.replace(/[^\d]/g, "");
}

function onAmountBlur(index, el) {
    const value = parseNumber(el.value);

    people[index].paid = value;

    el.value = formatNumber(value);

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