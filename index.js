import puppeteer from "puppeteer";
import fs from "fs";

let allSpeeches = [];

const browser = await puppeteer.launch({
  args: ["--no-sandbox"],
  headless: false,
  defaultViewport: false,
});

const page = await browser.newPage();

page.setDefaultNavigationTimeout(10 * 60 * 1000);

await page.goto("https://rbi.org.in/Scripts/BS_ViewSpeeches.aspx/", {
  waitUntil: "domcontentloaded",
});

const yearList = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("div.accordionButton")).map(
    (link) => link.innerText
  );
});

const fetchYearSpeeches = async (year) => {
  await page.evaluate((year) => {
    const element = document.getElementById(`${year}0`);
    if (element) {
      element.click();
    }
  }, year);

  await page.waitForSelector("table");

  const speeches = await page.evaluate(() => {
    let speeches = [];

    const speechList = document.querySelectorAll("table tr");

    for (let i = 0; i < speechList.length - 1; i += 2) {
      const dateElement = speechList[i].querySelector(".tableheader>b");

      const valueElement = speechList[i + 1].querySelector("td .link2");
      const pdfElement = speechList[i + 1].querySelector('a[target="_blank"]');

      if (dateElement && valueElement && pdfElement) {
        const date = dateElement.innerText.trim();
        const value = valueElement.innerText.trim();
        const pdf = pdfElement.getAttribute("href");

        speeches.push({ date, value, pdf });
      }
    }

    return speeches;
  });

  allSpeeches.push(...speeches);
};

for (let i = 2024; i > 2023; i--) {
  await fetchYearSpeeches(i);
}

// yearList.forEach(async (year) => {
//   await fetchYearSpeeches(2024);
//   // console.log(year);
// });
await browser.close();

const writeStream = fs.createWriteStream("data.csv");
const csvString = [
  ["date", "speech"],
  ...allSpeeches.map((item) => [item.date, item.value]),
]
  .map((e) => e.join(","))
  .join("\n");
writeStream.write(csvString);

console.log(allSpeeches);
console.log(yearList);
