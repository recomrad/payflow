function addPerson(data = { name: "", paid: 0, excluded: false }) {
    people.push({
        id: createId(),
        ...data
    });
    render();
}

function removePerson(index) {
    if (!confirm(`Удалить информацию об участнике ${people[index].name ? people[index].name : `без имени (${people[index].id})`}?`)) return;
    people.splice(index, 1);
    render();
}