var https = require('https');
var fs = require('fs');

module.exports = {
    downloadPhotos: photoURLs => {
        return new Promise(mainResolve => {
            //Creating download Promise to use https library to download given a URL and destination path
            var download = (url, dest) => {
                return new Promise((resolve, reject) => {
                    var file = fs.createWriteStream(dest);
                    var request = https.get(url, response => {
                        response.pipe(file);
                        file.on('finish', () => file.close(resolve("Image downloaded")));
                    }).on('error', err => fs.unlink(dest, () => reject(err.message)));
                });
            };

            if (!fs.existsSync('photos')) fs.mkdirSync('photos');
            //Running all generated promises in parallel
            Promise.all(photoURLs.map(url =>
                //Mapping the download promise to each url and setting the path to be in the subfolder 'photos'
                download(url, "photos/" + url.replace('https://photos.veracross.com/lville/', ''))
                    .catch(e => console.error("Error downloading file:", e))
            ))
                .then(() => mainResolve());
        });
    }
}