const creds = require('./creds');
var googleMapsClient = require('@google/maps').createClient({
    key: creds.apiKey
});

module.exports = {
    geocodeStudents: students => {
        return new Promise(resolveMain => {
            // Generating a template promise to later be mapped to each student
            var geocodeStudent = student => {
                return new Promise((resolve, reject) => {
                    if (!student.address) reject(new Error("No address for student " + student.name));
                    else {
                        googleMapsClient.geocode({ 'address': student.address }, (err, response) => {
                            if (response.json.status === 'OK') resolve(response.json.results[0].geometry.location);
                            else reject(new Error("Geocode for " + student.name + " was not successful: " + response.json.status));
                        });
                    }
                });
            }

            // Ensuring all requests aren't run at once so as to not flood the API
            var maxRequestsPerSecond = 40;
            var i = -1;
            Promise.all(students.map(student => {
                i++;
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        geocodeStudent(student)
                            .catch(e => reject(e))
                            .then(location => {
                                student.location = location;
                                resolve();
                            })
                        // Spacing out the API requests by a fixed time
                    }, 1000 / maxRequestsPerSecond * i)
                })
                    .catch(e => console.log(e))
            }))
                .then(() => resolveMain(students));
        });
    }
}