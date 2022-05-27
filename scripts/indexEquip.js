require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("@elastic/elasticsearch");

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
    const raw = fs.readFileSync(path.join(__dirname, "../data/equipment.json"));
    const data = JSON.parse(raw.toString());
    const operations = data.flatMap(doc => [{ index: { _index: 'equipments' } }, { ...doc, importer: { id: null, name: null} }]);

    const res = await client.bulk({
        refresh: true,
        operations,
    });

    await client.indices.refresh({ index: "equipments" });
}

main();