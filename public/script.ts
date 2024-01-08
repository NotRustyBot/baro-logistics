type ItemStack = { item: string; quantity: number };
type ItemDetail = { item: string; name: string; image: string; price: number; fabricator: Array<Array<ItemStack>>; deconstructor: Array<ItemStack> };

let details: Array<ItemDetail> = [];
let detailLookup = new Map<string, ItemDetail>();

function recursiveDeconstruction(item: ItemDetail, set?: Set<string>): Set<string> {
    if (set == undefined) {
        set = new Set();
    }
    for (const i of item.deconstructor) {
        if (set.has(i.item)) continue;
        set.add(i.item);
        const result = detailLookup.get(i.item);
        if (result) {
            recursiveDeconstruction(result, set);
        }
    }

    return set;
}

function deconstruct(item: ItemDetail, set: Set<string>) {
    for (const i of item.deconstructor) {
        if (set.has(i.item)) continue;
        set.add(i.item);
    }

    return set;
}

function recursiveFabrication(item: ItemDetail, set?: Set<string>): Set<string> {
    if (set == undefined) {
        set = new Set();
    }
    for (const is of item.fabricator) {
        for (const i of is) {
            if (set.has(i.item)) continue;
            set.add(i.item);
            const result = detailLookup.get(i.item);
            if (result) {
                recursiveFabrication(result, set);
            }
        }
    }
    return set;
}

function fabricate(item: ItemDetail, limit?: Set<string>): Array<Array<ItemDetail & { quantity: number }>> {
    const result = new Array<Array<ItemDetail & { quantity: number }>>();
    for (const is of item.fabricator) {
        const current: Array<ItemDetail & { quantity: number }> = [];

        for (const i of is) {
            const it = detailLookup.get(i.item);
            if (limit && !limit.has(i.item)) continue;
            if (it) current.push({ ...it, quantity: i.quantity });
        }
        if (current.length > 0) result.push(current);
    }

    return result;
}

function fabricatableTrash(items: Set<string>, sourceItems: Set<string>) {
    for (const item of details) {
        let canUse = false;
        if (item.fabricator.length == 0) continue;
        for (const is of item.fabricator) {
            for (const i of is) {
                if (sourceItems.has(i.item)) {
                    canUse = true;
                    break;
                }
            }
            if (canUse) break;
        }

        if (!canUse) continue;
        items.add(item.item)
        for (const is of item.fabricator) {
            for (const i of is) {
                items.add(i.item);
            }
        }
    }
}

function createPartial(item: ItemDetail) {
    const main = document.createElement("div");
    document.getElementsByClassName("partial-items");
}

function recursiveComponents(item: ItemDetail, parent: Element) {
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

function identifyAllTrash(trash: Iterable<string>) {
    const allTrash = new Set<string>();
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

function recursiveTrash(item: ItemDetail & { quantity?: number }, specifiedItems: Set<string>, parent: Element, allTrash: Set<string>) {
    const compOpts = fabricate(item, allTrash);
    const elm = document.createElement("div");
    elm.classList.add("trash");
    const img = document.createElement("img");
    img.setAttribute("src", "https://barotraumagame.com" + item.image);
    elm.appendChild(img);
    const text = document.createElement("a");
    text.setAttribute("href","https://barotraumagame.com" + item.item );
    elm.appendChild(text);
    text.innerText = item.name;
    if ("quantity" in item) {
        text.innerText = item.name + " x" + item.quantity;
    } else {
        item.quantity = 1;
    }

    parent.appendChild(elm);
    if (specifiedItems.has(item.name)) return;
    const price = document.createElement("span");
    price.classList.add("price");
    let cPrice = 0;
    let totalGain = 0;
    elm.appendChild(price);
    for (const comps of compOpts) {
        let tpr = Infinity;
        let tgain = 0;
        for (const comp of comps) {
            tpr = Math.min(comp.price * comp.quantity, tpr);
            tgain = Math.max(recursiveTrash(comp, specifiedItems, elm, allTrash) * comp.quantity, tgain);
        }
        cPrice += tpr;
        totalGain += tgain;
    }
    price.innerText = (item.price - cPrice) * item.quantity + "mk";
    if (item.price - cPrice < 0) {
        price.classList.add("bad");
    } else if (compOpts.length > 0) {
        price.classList.add("good");
        price.innerText = "+" + price.innerText;
    }

    if (compOpts.length > 0) {
        if (totalGain != 0) price.innerText += ` (${(item.price - cPrice + totalGain) * item.quantity}mk)`;
        elm.style.order = "" + (10000 - (item.price - cPrice + totalGain));
        return item.price - cPrice + totalGain;
    } else {
        elm.style.order = "" + 10000;
        return 0;
    }
}

fetch("itemDetail.json").then((r) =>
    r.json().then((data) => {
        details = data;
        for (const datum of details) {
            detailLookup.set(datum.item, datum);
            //trashSource.add(datum.item);
        }
        updateTrashSource();
    })
);

const trashSearch = document.getElementById("trash-search") as HTMLInputElement;
const trashclick = document.getElementsByClassName("trash-click")[0] as HTMLDivElement;
trashSearch.addEventListener("input", (e) => {
    for (const child of [...trashclick.children]) {
        child.remove();
    }

    for (const item of details) {
        if (trashSource.has(item.item)) continue;
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

const trashItems = document.getElementsByClassName("trash-items")[0] as HTMLDivElement;
const optionsParent = document.getElementsByClassName("trash-options")[0] as HTMLDivElement;

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
        if (t) recursiveTrash(detailLookup.get(t), trashSource, optionsParent, tr);
    }
}

const trashSource = new Set<string>();
