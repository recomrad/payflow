function createId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Math.floor(Date.now()) + Math.floor(Math.random() * 100000) + Math.floor(Math.random() * 100000));
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");

    setTimeout(() => {
        t.classList.remove("show");
    }, 2000);
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