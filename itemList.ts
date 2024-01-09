import fs from "fs";
import { Cheerio, CheerioAPI, Element, load } from "cheerio";

async function getAllItems() {
    const html = await (await fetch("https://barotraumagame.com/wiki/Items")).text();
    const $ = load(html);
    const objs = new Set<string>();
    $('table tbody tr td ul li a').each((i, el) => {
        objs.add( el.attribs["href"]);
    });
    fs.writeFileSync("itemList.json", JSON.stringify([...objs]));
}

getAllItems();
