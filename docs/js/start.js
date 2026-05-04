
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

document.getElementById("roundMode").onchange = () => {
    localStorage.setItem("roundMode", document.getElementById("roundMode").value);
    render();
};

addBtn.onclick = () => addPerson();

load();
render();
