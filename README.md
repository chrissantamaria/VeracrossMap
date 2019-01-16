# VeracrossMap

#### This project is depreciated and will likely not work with the current version of Veracross. Please use only for reference.

## Overview

VeracrossMap is a geographic display of student data from the school management platform Veracross. The project utilizes Puppeteer to run a headless browser and act like a real user to access the Veracross directory page and strip student data and photos. The Google Maps API is then used to geocode addresses and eventually display them on a map to view student distribution.

## Installation

1. Run "npm install" in this directory to install all dependencies (puppeteer, Google Maps geocoder)

2. Follow these steps to obtain a Google Maps API key: https://developers.google.com/maps/documentation/javascript/get-api-key

3. Open "creds.js" and enter your Veracross login credentials and API key

4. Open "index.html", scroll to the bottom and find the line beginning with "<script src="https://maps.googleapis.com". Replace "API_KEY" with your API key.

5. Run "node scrape" to generate "students.json" with student data and the "photos" directory with all student photos

6. Run "node server" to start the HTTP web server

7. Visit "localhost:8888" in your browser
