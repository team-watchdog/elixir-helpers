var axios = require('axios');

async function getPlace(apiKey, text, fields) {
    var configPlaceSearch = {
        method: 'get',
        url: 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
        headers: { },
        params: {
            input: text,
            inputtype: "textquery",
            fields: fields.join(","),
            key: apiKey,
        }
        
    };

    let place;

    try {
        const resp = await axios(configPlaceSearch);
        if (!resp.data || !resp.data.candidates || resp.data.candidates.length === 0) return null;
        place = resp.data.candidates[0];
    } catch (e) {
        throw e;
    }

    var configPlaceDetail = {
        method: 'get',
        url: 'https://maps.googleapis.com/maps/api/place/details/json',
        headers: { },
        params: {
            place_id: place.place_id,
            fields: "address_component",
            key: apiKey,
        }
    };

    try {
        const resp = await axios(configPlaceDetail);
        if (!resp.data || !resp.data.result) return place;
        place.addressComponents = resp.data.result.address_components;
    } catch (e) {
        throw e;
    }

    return place;

}

module.exports = {
    getPlace,
}