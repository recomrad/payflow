
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