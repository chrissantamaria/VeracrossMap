const puppeteer = require('puppeteer');
var fs = require('fs');
const geocode = require('./geocode');
const download = require('./download');
const creds = require('./creds');

async function run() {
    const browser = await puppeteer.launch({
        // Can be set to false to show the page content as it runs
        // headless: false
    });
    const page = await browser.newPage();
    // Relaying console messages from the page to the Node console
    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i)
            console.log(`${i}: ${msg.args()[i]}`);
    });

    await page.goto('https://portals.veracross.com/lville/student/directory/1');

    await page.click('#username');
    await page.keyboard.type(creds.username);

    await page.click('#password');
    await page.keyboard.type(creds.password);

    await page.click('#login-button');

    // Seems to be a bug with Puppeteer with networkidle0 so a 3 second wait is used instead to ensure the page is loaded
    // await page.waitForNavigation({ waitUntil: "networkidle0" });
    const waitFor = timeToWait => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, timeToWait);
        });
    };
    await waitFor(3000);

    console.log("Page load begin");
    // Clicking each "Load More" button as they appear to load the entire page
    await page.evaluate(() => {
        return new Promise(resolve => {
            var timer = setInterval(clickButton, 800);
            var count = 1;
            function clickButton() {
                var elements = document.getElementsByClassName('directory-Entries_LoadMoreButton');
                if (elements[elements.length - 1].offsetParent == null) {
                    clearInterval(timer);
                    resolve();
                } else {
                    console.log("Load buttton #" + count + " clicked");
                    count++;
                    elements[elements.length - 1].click();
                }
            }
        });
    });
    console.log("Page load finished");

    console.log("Scraping student data");
    //Using Veracross's JQuery plugin to scrape student data and image URLs
    var scrapeData = await page.evaluate(() => {
        var students = [];
        var photoURLs = [];
        // Iterating through a collection of each student (based on their HTML class of .directory-entry)
        $('.directory-Entry').each(function (i) {
            try {
                var student = {}

                // Try-catch is used incase a student does not provide info for a given field
                try {
                    student.name = $(this).find(".directory-Entry_Title")[0].textContent.trim();
                } catch (e) {
                    console.error("(Student " + i + "): Error scraping name");
                } try {
                    student.form = $(this).find(".directory-Entry_Tag")[0].textContent.trim();
                } catch (e) {
                    console.error("(Student " + i + "): Error scraping form");
                } try {
                    student.address = $(this).find(".directory-Entry_FieldTitle")[0].textContent.trim();
                } catch (e) {
                    console.error("(Student " + i + "): Error scraping address");
                } try {
                    student.photo = $(this).find(".directory-Entry_PersonPhoto--square")[0].style.backgroundImage.replace('url("https://photos.veracross.com/lville/', '').replace('")', '');
                } catch (e) {
                    console.error("(Student " + i + "): Error scraping photo path");
                }
                students.push(student);

                //Storing photo URLs separately so they can later be downloaded
                try {
                    var url = $(this).find(".directory-Entry_PersonPhoto--square")[0].style.backgroundImage.replace('url("', '').replace('")', '');
                    photoURLs.push(url);
                } catch (e) {
                    console.error("(Student " + i + "): Error scraping photo url");
                }
            } catch (e) {
                // console.error(e);
            }
        });
        return [students, photoURLs];
    });
    var students = scrapeData[0];
    // Uncomment to limit sample size and not flood your Google Maps API geocoding limit when testing
    // students = students.slice(0, 12);
    var photoURLs = scrapeData[1];

    // Asynchronously downloading student photos and geocoding student addresses

    console.log("Beginning photo download");
    download.downloadPhotos(photoURLs)
        .then(() => console.log("Photo download complete"));

    console.log("Beginning geocoding");
    geocode.geocodeStudents(students)
        .then(newStudents => {
            console.log("Geocoding complete");

            console.log("Writing student data to students.json");
            // Coverting student data to beautified JSON and saving to local file
            fs.writeFile('./students.json', JSON.stringify(newStudents, null, 4), err => {
                if (err) console.error(err);
                else console.log('Student data write successful');
            });
        });

    browser.close();
}
run();