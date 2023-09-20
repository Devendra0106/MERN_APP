const axios = require("axios");
const HTTPError = require("../models/http-error");

const API_KEY = 'Aizasdvsgdvsgssgvcsvcsvhsvdshvhsvdhshdv';

async function getCoordinatesForAddress(address){
    return{
        lat: 40.7484474, 
        lng: -73.9871516
    }
    //actual code when having valid API Key---->
    // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
    // const data = response.data;

    // if(!data || data.status === 'ZERO_RESULT'){
    //     const error = new HTTPError('Could not find the location for specified address.',422);
    //     throw error;
    // }

    // const coordinates = data.results[0].geometry.location;
    // return coordinates;
}

module.exports = getCoordinatesForAddress;