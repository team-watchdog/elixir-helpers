require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("@elastic/elasticsearch");
const { stringify } = require("csv-stringify");

const client = new Client({
    cloud: {
        id: process.env.ELASTICSEARCH_CLOUD_ID
    },
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
    }
});

async function main(){
    const writableStream = fs.createWriteStream(path.join(__dirname, "../data/drugs_list.csv"));
    const stringifier = stringify({ header: true });

    const resp = await client.search({
        index: "drugs",
        size: 10000,
        query: undefined,
        sort: [
            { 
                createdAt : {
                    order : "desc", 
                    format : "strict_date_optional_time_nanos"
                }
            },
        ]
    });

    for (let row of resp.hits.hits) {
        stringifier.write({
            id: row._id,
            genericName: row._source.genericName,
            brandName: row._source.brandName,
            country: row._source.country,
            expiryDate: row._source.expiryDate,
            schedule: row._source.schedule,
            importerName: row._source.importer ? row._source.importer.name : "",
            importerId: row._source.importer ? row._source.importer.id : "",
            aliases: row._source.aliases,
        });
    }

    stringifier.pipe(writableStream);
    
    console.log(resp.hits);
}

main();