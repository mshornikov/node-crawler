const express = require("express");
const { fetcher } = require("../fetcher.js");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(express.json());

const findLink = (string) => {
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
    const links = [];

    let match;
    while ((match = linkRegex.exec(string))) {
        links.push(match[2]);
    }

    return links;
};

app.post("/parse", async (req, res) => {
    const { domainName } = req.body;
    const visited = new Set();
    const queue = [domainName];
    let pages = [];

    while (queue.length > 0) {
        const link = queue.shift();
        if (visited.has(link)) continue;
        visited.add(link);
        try {
            for (i = 0; i <= 1; i++) {
                const fetchedURL = await fetcher(link);
                if (fetchedURL.status === 200) {
                    const links = findLink(await fetchedURL.text());
                    for (const link of links) {
                        if (!link.startsWith(domainName)) {
                            queue.push(domainName + link);
                        } else {
                            queue.push(link);
                        }
                    }
                    pages.push(link);
                    break;
                } else if (fetchedURL.status === 500) {
                    continue;
                }
            }
        } catch (error) {
            console.error(`Ошибка ${link}: ${error.message}`);
        }
    }

    fs.writeFile("output.txt", pages.join("\n"), (err) => {
        if (err) throw err;
        console.log("Данные записаны в файл");
    });

    res.send(pages);
});

app.listen(port, () => {
    console.log(`Краулер запущен на http://localhost:${port}/parse`);
});
