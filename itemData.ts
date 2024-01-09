import fs from "fs";
import { Cheerio, CheerioAPI, Element, load } from "cheerio";
type ItemOverview = { item: string; image: string };
type ItemStack = { item: string; quantity: number };
type ItemDetail = { item: string; name: string; image: string; price: number; fabricator: Array<Array<ItemStack>>; deconstructor: Array<ItemStack>; quantity: number };

async function getItemDetail(overview: ItemOverview) {
    const result: ItemDetail = { deconstructor: [], fabricator: [], image: overview.image, item: overview.item, name: "", price: 0, quantity: 1 };
    const html = await (await fetch("https://barotraumagame.com" + overview.item)).text();
    const $ = load(html);

    result.name = $("span.mw-page-title-main").text();
    result.price = parseInt($('table.infobox td:contains("Base")').siblings("td").find("b").text());
    let fabricator: Array<ItemStack> = [];
    const qmatch = $('table.infobox td:contains("Fabricator")').text().match(/(\d+)/);
    if (qmatch) result.quantity = parseInt(qmatch[0]);
    $('table.infobox td:contains("Fabricator")')
        .siblings("td")
        .find("div:last")
        .contents()
        .each((i, el) => {
            if ("tagName" in el) {
                if (el.tagName == "span") {
                    const item = $(el).find("a").attr("href") ?? "";
                    if (item != "/wiki/File:Time.png") fabricator.unshift({ item, quantity: 1 });
                } else if (el.tagName == "br") {
                    result.fabricator.push(fabricator);
                    fabricator = [];
                }
            } else if (el.nodeType == 3) {
                const qty = $(el).text().match(/(\d+)/);
                if (qty && fabricator.length > 0) {
                    fabricator[0].quantity = parseInt(qty[0]);
                }
            }
        });
    if (fabricator.length > 0) result.fabricator.push(fabricator);
    let toPush = { item: "", quantity: 1 };
    $('table.infobox td:contains("Deconstructor")')
        .siblings("td")
        .find("div:last")
        .contents()
        .each((i, el) => {
            if ("tagName" in el) {
                if (el.tagName == "span") {
                    const item = $(el).find("a").attr("href") ?? "";
                    if (item != "/wiki/File:Time.png") {
                        toPush.item = item;
                        const b = $(el).find("b");
                        if (b.text()) {
                            toPush.quantity = parseInt(b.text());
                        }
                    }
                } else if (el.tagName == "br") {
                    result.deconstructor.unshift(toPush);
                    toPush = { item: "", quantity: 1 };
                }
            } else if (el.nodeType == 3) {
                if (!$(el).text().includes("s")) {
                    const qty = $(el).text().match(/(\d+)/);
                    if (qty) {
                        toPush.quantity = parseInt(qty[0]);
                    }
                }
            }
        });
    return result;
}

async function start() {
    const out: Array<ItemDetail> = [];
    const list = JSON.parse(fs.readFileSync("itemList.json", "utf-8")) as Array<ItemOverview>;
    let progress = 0;
    for (const io of list) {
        progress++;
        out.push(await getItemDetail(io));
        console.log(progress + "/" + list.length);
    }

    fs.writeFileSync("itemDetail.json", JSON.stringify(out));
}

start();
