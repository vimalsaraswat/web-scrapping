import puppeteer from "puppeteer";
import fs from "fs";

let allSpeeches = [];
let yearlist = [];

const fetchYearSpeeches = async (year) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: false,
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(10 * 60 * 1000);

  await page.goto("https://rbi.org.in/Scripts/BS_ViewSpeeches.aspx/", {
    waitUntil: "domcontentloaded",
  });
  //  await page.evaluate((yearList) => {
  // },year)

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

      if (dateElement && valueElement) {
        const date = dateElement.innerText.trim();
        const value = valueElement.innerText.trim();

        speeches.push({ date, value });
      }
    }

    return speeches;
  });

  allSpeeches.push(...speeches);

  await browser.close();
};

for (let i = 2024; i > 2020; i--) {
  await fetchYearSpeeches(i);
}

const writeStream = fs.createWriteStream("data.csv");

const csvString = [
  ["date", "speech"],
  ...allSpeeches.map((item) => [item.date, item.value]),
]
  .map((e) => e.join(","))
  .join("\n");

writeStream.write(csvString);

console.log(allSpeeches);
