function encodeData(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeData(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

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

