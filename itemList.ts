import fs from "fs";
import { Cheerio, CheerioAPI, Element, load } from "cheerio";

async function addFromPage(objs: Set<string>, url: string) {
    const html = await (await fetch(url)).text();
    const $ = load(html);
    $(".mw-category-group a").each((i, el) => {
        objs.add(el.attribs["href"]);
    });
}

async function getAllItems() {
    const objs = new Set<string>();
    await addFromPage(objs, "https://barotraumagame.com/baro-wiki/index.php?title=Category:Items&pageuntil=Harmonica#mw-pages");
    await addFromPage(objs, "https://barotraumagame.com/baro-wiki/index.php?title=Category:Items&pageuntil=Thermal+Goggles#mw-pages");
    await addFromPage(objs, "https://barotraumagame.com/baro-wiki/index.php?title=Category:Items&pagefrom=Thermal+Goggles#mw-pages");

    fs.writeFileSync("itemList.json", JSON.stringify([...objs]));
}

getAllItems();
