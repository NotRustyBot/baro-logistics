import fs from "fs";
import { Cheerio, CheerioAPI, Element, load } from "cheerio";

async function getAllItems() {
    const html = await (await fetch("https://barotraumagame.com/wiki/Items")).text();
    const $ = load(html);
    const objs: Array<{ item: string; image: string }> = [];
    $('table tbody tr td ul li span[style="white-space: nowrap"] span[typeof="mw:File"]').each((i, el) => {
        objs.push({ item: $(el).children("a").attr("href") ?? "", image: $(el).children("a").children("img").attr("src") ?? "" });
    });
    fs.writeFileSync("itemList.json", JSON.stringify(objs));
}

getAllItems();
