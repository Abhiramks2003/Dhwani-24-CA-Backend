const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const readExcelFile = require('./extraction.js');
const { createClient } = require('@sanity/client');
const cors = require('cors');
const reader = require('xlsx')



dotenv.config();


const client = createClient({
    projectId: '39xsv51w', // you can find this in sanity.json
    dataset: 'original', // or the name of your dataset
    token: process.env.TOKEN, // or leave blank for unauthenticated usage
    useCdn: false // `false` if you want to ensure fresh data
});


const app = express();
const data = readExcelFile('Referral codes.xlsx');
ambassador_data = [];
for (let i = 0; i < data.length; i++) {
    console.log(`${i} ${data[i]}`);
    ambassador_data.push({
        name: data[i].name,
        referal_code: data[i].referal_code,
        ref_score: 0,
    });
}
app.use(bodyParser.json());
app.use(cors());


app.get("/", async (req, res) => {
    try {
        const url1 = "https://dev.bharatversity.com/events/website/api/hosted-events-api/?limit=100&offset=00";
        const result1 = await axios.get(url1, {
            headers: {
                'Authorization': process.env.AUTH,
            }
        });
        event_ids = result1.data["results"];
        console.log(event_ids.length);
        for (let i = 0; i < event_ids.length; i++) {
            const url3 = `https://dev.bharatversity.com/events/website/api/event-amount-overview-list-api/${event_ids[i].id}/?search=&payment_status=&limit=`;
            const url2 = `https://dev.bharatversity.com/events/website/api/registered-individuals-api/${event_ids[i].id}/?limit=1000&offset=&search=`;
            const result2 = await axios.get(url2, {
                headers: {
                    'Authorization': process.env.AUTH,
                }
            });
            const result3 = await axios.get(url3, {
                headers: {
                    'Authorization': process.env.AUTH,
                }
            });

            let event_fee = null;

            if (
                result3 &&
                result3.data &&
                result3.data.results &&
                result3.data.results[0] &&
                result3.data.results[0]["amount"]
            ) {
                event_fee = result3.data.results[0]["amount"] / 100;

            }
            console.log(event_ids[i].title);
            console.log(event_fee);


            if (result2.data["count"] > 0) {
                console.log(event_ids[i].id);
                console.log(result2.data.count);
                const participants = result2.data["results"];
                for (let j = 0; j < participants.length; j++) {
                    try {

                        if (participants[j]["extra_questions"].length !== 0) {

                            const referal_code = participants[j]["extra_questions"][0]["answer"];
                            console.log(referal_code);

                            for (let k = 0; k < data.length; k++) {
                                if (data[k].referal_code.toLowerCase().trim() === referal_code.toLowerCase().trim()) {
                                    let points = 0;

                                    if (event_fee === null) {
                                        // console.error("Error: event_fee is null");
                                    } else if (event_ids[i].title == "ATHER EV WORKSHOP") {
                                        points = 50;
                                    }
                                    // else if (event_ids[i].title == "Electrify Your Ride: The IC to E-Bike Experience (Retrofitting workshop)") {
                                    //     points = 100;
                                    // }
                                    else {
                                        // Convert event_fee back to the original value
                                        const originalValue = event_fee / 1.05;

                                        if (originalValue >= 50 && originalValue < 99) {
                                            points = 10;
                                        } else if (originalValue >= 99 && originalValue < 299) {
                                            points = 15;
                                        } else if (originalValue >= 299 && originalValue < 599) {
                                            points = 20;
                                        } else if (originalValue >= 599 && originalValue < 999) {
                                            points = 25;
                                        } else if (originalValue >= 1000 && originalValue < 1499) {
                                            points = 30;
                                        } else if (originalValue >= 1499 && originalValue < 2499) {
                                            points = 40;
                                        } else if (originalValue >= 2500 && originalValue < 4999) {
                                            points = 50;
                                        } else if (originalValue >= 9999) {
                                            points = 60;
                                        } else {
                                            // console.error("Error: originalValue is out of range");
                                        }
                                    }


                                    data[k].count += points;
                                    ambassador_data[k].ref_score += points;
                                    console.log(data[k].count);
                                }
                            }

                        };
                    } catch {
                        console.log("error");
                    }
                }

            }






        };



        // Requiring module 

        // Reading our test file 



        for (let i = 0; i < data.length; i++) {
            if (data[i].count > 0) {
                console.log(data[i]);
            }
        }

        for (let index = 0; index < data.length; index++) {

            await client.createIfNotExists({
                _id: data[index].referal_code,
                _type: 'ambassador',
                name: data[index].name,
                ref_code: data[index].referal_code,
                ref_count: data[index].count,
                college: data[index].college,
                share_score: 0,

            }).then(res => {
                console.log(`${index} Person was created, document ID is ${res._id}`)
            }).catch(err => {
                console.error('Error:', err)
            });

            await client
                .patch(`${data[index].referal_code}`) // Document ID to patch
                .set({ ref_count: data[index].count, ref_code: data[index].referal_code }) // Shallow merge
                .commit() // Perform the patch and return a promise
                .then((updatedBike) => {
                    console.log('Hurray, the bike is updated! New document:')
                    console.log(updatedBike)
                })
                .catch((err) => {
                    console.error('Oh no, the update failed: ', err.message)
                });
        };

        const file = reader.readFile('test.xlsx');
        const ws = reader.utils.json_to_sheet(ambassador_data);
        reader.utils.book_append_sheet(file, ws, "Sheet2")

        // Writing to our file 
        reader.writeFile(file, 'test.xlsx');



        // for (let index = 0; index < data.length; index++) {
        //     await client.getDocument(data[index].referal_code).then((item) => {
        //         console.log(`${item.name} (${item.share_score} ) (${item.ref_code} ) (${item.ref_count} )`)
        //     })
        // }

    } catch (error) {
        res.send(error);
    }
    res.send("Hello World");
});

app.listen(process.env.PORT, () => {
    console.log('server started');
});