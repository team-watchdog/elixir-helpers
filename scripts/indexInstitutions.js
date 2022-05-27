require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("@elastic/elasticsearch");

const { getPlace } = require('../common/places');

const client = new Client({
    cloud: {
        id: process.env.ELASTICSEARCH_CLOUD_ID
    },
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
    }
});


async function populateGeolocationData(){
    const raw = fs.readFileSync(path.join(__dirname, "../data/institutions.json"));
    const data = JSON.parse(raw.toString());

    const fullCount = data.length;
    let i = 1;

    const fullData = [];

    for (let row of data) {
        const parsed = {
            name: row["Name of Institution"],
            type1: row["Type - Level 1"],
            type2: row["Type - Level 2"],
            ownership: row["Ownership"],
            rdhs: row["RDHS"],
            sn: row["SN"],
            field4: row["FIELD4"],
            check: row["Check"],
            hin: row["HIN"],
        }
        
        const locationName = `${parsed.name} ${parsed.type1} ${parsed.type2}`;
        const tmp = await getPlace(process.env.GOOGLE_API_KEY, locationName, ["geometry","name","place_id"]);
        console.log(JSON.stringify({ ...tmp, ...parsed }));
        /*
        try {
            const res = await client.index({
                index: "drug",
                document: row,
            });
        } catch (e) {
            console.log(e);
        }
        */
    }

    await fs.writeFile(path.join(__dirname, "../data/institutions_with_geo.json"), JSON.stringify(fullData));

    //await client.indices.refresh({ index: "drug" });
}

async function parsePlaceList(){
    const raw = fs.readFileSync(path.join(__dirname, "../data/institutions_geo.ldjson"));
    const data = [];
    
    for (let line of raw.toString().split("\n")){
        const row = JSON.parse(line);

        // province
        let province = null;
        let district = null;

        if (row.addressComponents) {
            // Province
            let tmpProv = row.addressComponents.filter((comp) => {
                if (comp.types.indexOf("administrative_area_level_1") > -1) return true;
                return false;
            });

            if (tmpProv && tmpProv.length > 0) province = tmpProv[0].long_name;

            // District
            let tmpDist = row.addressComponents.filter((comp) => {
                if (comp.types.indexOf("administrative_area_level_2") > -1) return true;
                return false;
            });

            if (tmpDist && tmpDist.length > 0) district = tmpDist[0].long_name;
        }

        const processed = {
            name: row.name,
            fullName: `${row.name} ${row.type2} ${row.type1}`,
            type1: row.type1,
            type2: row.type2,
            ownership: row.ownership,
            rdhs: row.rdhs,
            sn: row.sn,
            field4: row.field4,
            check: row.check,
            hin: row.hin,
            geo: {
                lat: row.geometry ? row.geometry.location.lat : null,
                lon: row.geometry ? row.geometry.location.lng : null,
            },
            placeId: row.place_id ? row.place_id : null,
            district,
            province,
        }
        data.push(processed);
    }

    const operations = data.flatMap(doc => [{ index: { _index: 'institutions' } }, doc]);
    const res = await client.bulk({
        refresh: true,
        operations,
    });

    await client.indices.refresh({ index: "institutions" });
}

/*
async function main(){
    const raw = fs.readFileSync(path.join(__dirname, "../data/medicine.json"));
    const data = JSON.parse(raw.toString());
    const operations = data.flatMap(doc => [{ index: { _index: 'drugs' } }, doc]);

    const res = await client.bulk({
        refresh: true,
        operations,
    });

    await client.indices.refresh({ index: "drugs" });
}
*/


// populateGeolocationData();
parsePlaceList();