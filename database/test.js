var AuthenticationService = require('../services/authentication-service')
const keytar = require('keytar');
const envVariables = require('../env-variables');
const axios = require('axios');
const querystring = require('querystring');
const WcmProvider = require('../providers/wcm');
const moment = require('moment');
const os = require('os');
const db = require('./database')


const { clientId, clientSecret, redirectUri } = envVariables.wcm;
let oAuthprovider = new WcmProvider(axios, querystring, clientId, clientSecret);
let authenticationService = new AuthenticationService(keytar, moment, os, oAuthprovider, redirectUri);

// console.log('Test Called', authenticationService)

function test() {
    authenticationService.getAccessToken((token) => {
        console.log('Token Value', token)

        const options = {
            headers: { 'Authorization': 'Bearer ' + token }
        };

        axios.get('https://gwaas-b7mbepvdgi.us3.hana.ondemand.com/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/TimeEventSet', options).then((resp) => {
            console.log(resp, 'asdsadksadjsdjsadksadjsakdsad')
            let myarr = {
                // elements: resp.data.d.EntitySets,
                elements: resp.data.d.results
            }

            db.find({}, function (error, docs) {
                if (docs.length) {
                    console.log(docs, 'Retrieved from the database')
                    return docs;
                }
                else if (docs.length === 0) {

                    db.insert(myarr, function (err, newDoc) {   // Callback is optional
                        console.log(newDoc, 'Created')

                        // newDoc is the newly inserted document, including its _id
                    });
                }
            })


        })
    })

}

module.exports = test;