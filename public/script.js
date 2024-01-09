let details = [];
let detailLookup = new Map();
function recursiveDeconstruction(item, set) {
    if (set == undefined) {
        set = new Set();
    }
    for (const i of item.deconstructor) {
        if (set.has(i.item))
            continue;
        set.add(i.item);
        const result = detailLookup.get(i.item);
        if (result) {
            recursiveDeconstruction(result, set);
        }
    }
    return set;
}
function deconstruct(item, set) {
    for (const i of item.deconstructor) {
        if (set.has(i.item))
            continue;
        set.add(i.item);
    }
    return set;
}
function recursiveFabrication(item, set) {
    if (set == undefined) {
        set = new Set();
    }
    for (const is of item.fabricator) {
        for (const i of is) {
            if (set.has(i.item))
                continue;
            set.add(i.item);
            const result = detailLookup.get(i.item);
            if (result) {
                recursiveFabrication(result, set);
            }
        }
    }
    return set;
}
function fabricate(item, limit) {
    const result = new Array();
    for (const is of item.fabricator) {
        const current = [];
        for (const i of is) {
            const it = detailLookup.get(i.item);
            if (limit && !limit.has(i.item))
                continue;
            if (it)
                current.push(Object.assign(Object.assign({}, it), { count: i.quantity }));
        }
        if (current.length > 0)
            result.push(current);
    }
    return result;
}
function fabricatableTrash(items, sourceItems) {
    for (const item of details) {
        let canUse = false;
        if (item.fabricator.length == 0)
            continue;
        if (sourceItems.has(item.item) || items.has(item.item)) {
            canUse = true;
        }
        else {
            for (const is of item.fabricator) {
                for (const i of is) {
                    if (sourceItems.has(i.item)) {
                        canUse = true;
                        break;
                    }
                }
                if (canUse)
                    break;
            }
        }
        if (!canUse)
            continue;
        items.add(item.item);
        for (const is of item.fabricator) {
            for (const i of is) {
                items.add(i.item);
            }
        }
    }
}
function isRelevant(item, sourceItems) {
    let isRelevant = false;
    if (sourceItems.has(item.item)) {
        return true;
    }
    for (const is of item.fabricator) {
        for (const i of is) {
            if (sourceItems.has(i.item)) {
                isRelevant = true;
                break;
            }
        }
        if (isRelevant)
            break;
    }
    return isRelevant;
}
function createPartial(item) {
    const main = document.createElement("div");
    document.getElementsByClassName("partial-items");
}
function recursiveComponents(item, parent) {
    const compOpts = fabricate(item);
    const elm = document.createElement("div");
    elm.classList.add("component");
    const img = document.createElement("img");
    img.setAttribute("src", "https://barotraumagame.com" + item.image);
    elm.appendChild(img);
    const text = document.createElement("span");
    elm.appendChild(text);
    text.innerText = item.name;
    parent.appendChild(elm);
    for (const comps of compOpts) {
        for (const comp of comps) {
            recursiveComponents(comp, elm);
        }
    }
}
function identifyAllTrash(trash) {
    const allTrash = new Set();
    for (const tr of trash) {
        allTrash.add(tr);
    }
    let lastSize = allTrash.size;
    do {
        lastSize = allTrash.size;
        /*
        for (const item of trash) {
            if (detailLookup.get(item)) {
                deconstruct(detailLookup.get(item), allTrash);
            } else {
                console.log(item);
            }
        }*/
        fabricatableTrash(allTrash, new Set(trash));
    } while (lastSize != allTrash.size);
    return allTrash;
}
function recursiveTrash(item, specifiedItems, parent, allTrash) {
    const compOpts = fabricate(item, allTrash);
    const elm = document.createElement("div");
    const container = document.createElement("div");
    elm.appendChild(container);
    elm.classList.add("trash");
    const img = document.createElement("img");
    img.setAttribute("src", "https://barotraumagame.com" + item.image);
    container.appendChild(img);
    const text = document.createElement("a");
    text.setAttribute("href", "https://barotraumagame.com" + item.item);
    text.setAttribute("target", "_blank");
    container.appendChild(text);
    text.innerText = item.name;
    if ("count" in item == false) {
        item.count = item.quantity;
    }
    text.innerText = item.name + " x" + item.count;
    parent.appendChild(elm);
    if (specifiedItems.has(item.name))
        return;
    const price = document.createElement("span");
    price.classList.add("price");
    let cPrice = 0;
    let totalGain = 0;
    container.appendChild(price);
    for (const comps of compOpts) {
        let tpr = Infinity;
        let tgain = 0;
        const opt = document.createElement("div");
        opt.classList.add("trash-option-craft");
        elm.appendChild(opt);
        if (comps.length == 1) {
            opt.style.borderLeft = "none";
        }
        else {
            opt.classList.add("or");
        }
        for (const comp of comps) {
            tpr = Math.min((comp.price * comp.count) / comp.quantity, tpr);
            tgain = Math.max((recursiveTrash(comp, specifiedItems, opt, allTrash) * comp.count) / comp.quantity, tgain);
        }
        cPrice += tpr;
        totalGain += tgain;
    }
    price.innerText = item.price * item.quantity - cPrice + "mk";
    if (item.price * item.quantity - cPrice < 0) {
        price.classList.add("bad");
    }
    else if (compOpts.length > 0) {
        price.classList.add("good");
        price.innerText = "+" + price.innerText;
    }
    if (compOpts.length > 0) {
        if (totalGain != 0)
            price.innerText += ` (${item.price * item.quantity - cPrice + totalGain}mk)`;
        elm.style.order = "" + (10000 - (item.price * item.quantity - cPrice + totalGain));
        return item.price * item.quantity - cPrice + totalGain;
    }
    else {
        elm.style.order = "" + 10000;
        return 0;
    }
}
fetch("itemDetail.json").then((r) => r.json().then((data) => {
    details = data;
    for (const datum of details) {
        detailLookup.set(datum.item, datum);
        //trashSource.add(datum.item);
    }
    updateTrashSource();
}));
const trashSearch = document.getElementById("trash-search");
const trashclick = document.getElementsByClassName("trash-click")[0];
trashSearch.addEventListener("input", (e) => {
    for (const child of [...trashclick.children]) {
        child.remove();
    }
    for (const item of details) {
        if (trashSource.has(item.item))
            continue;
        if (item.name.toLowerCase().includes(trashSearch.value.toLowerCase())) {
            const div = document.createElement("div");
            div.classList.add("trashcl");
            trashclick.appendChild(div);
            const name = document.createElement("span");
            div.appendChild(name);
            name.textContent = item.name;
            const image = document.createElement("img");
            image.setAttribute("src", "https://barotraumagame.com" + item.image);
            div.appendChild(image);
            div.addEventListener("click", (c) => {
                trashSearch.value = "";
                trashSource.add(item.item);
                for (const child of [...trashclick.children]) {
                    child.remove();
                }
                updateTrashSource();
            });
        }
    }
});
const trashItems = document.getElementsByClassName("trash-items")[0];
const optionsParent = document.getElementsByClassName("trash-options")[0];
function updateTrashSource() {
    for (const child of [...trashItems.children]) {
        child.remove();
    }
    for (const itemType of trashSource) {
        const item = detailLookup.get(itemType);
        const div = document.createElement("div");
        div.classList.add("trashcl");
        trashItems.appendChild(div);
        const name = document.createElement("span");
        div.appendChild(name);
        name.textContent = item.name;
        const image = document.createElement("img");
        image.setAttribute("src", "https://barotraumagame.com" + item.image);
        div.appendChild(image);
        div.addEventListener("click", (c) => {
            trashSource.delete(item.item);
            updateTrashSource();
        });
    }
    for (const child of [...optionsParent.children]) {
        child.remove();
    }
    const tr = identifyAllTrash(trashSource);
    for (const t of tr) {
        if (t && isRelevant(detailLookup.get(t), trashSource))
            recursiveTrash(detailLookup.get(t), trashSource, optionsParent, tr);
    }
}
const trashSource = new Set();
