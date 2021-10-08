module.exports = {
  wcmdev: {
    //clientId:     'eee88115-eda5-3c9c-865a-a1e9b5fab585',
    //clientSecret: 'weillcornellmedicalcollege',
    clientId: 'da94326e-4a70-393c-a6df-a2e1625fa3e6',
    clientSecret: 'wweillcornellgw',
    redirectUri: 'https://localhost:3000/callback',
    oAuthBaseUrl: 'https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com',
    oDataEndPoint: 'https://gwaas-b7mbepvdgi.us3.hana.ondemand.com'
  },
  dev: {
    clientId: 'da94326e-4a70-393c-a6df-a2e1625fa3e6', // Replace with Dev Client Id
    clientSecret: 'wweillcornellgw', // Replace with Dev Client secret
    redirectUri: 'https://localhost:3000/callback', // Remains same or replace it as necessary
    oAuthBaseUrl: 'https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com', //Remains same or replace it as necessary
    oDataEndPoint: 'https://gwaas-b7mbepvdgi.us3.hana.ondemand.com'
  },
  wcm: {
    clientId: '60b0aabb-3422-323c-830f-4fea12621cbf', // Replace with qa Client Id
    //clientSecret: 'wweillcornellgw', // Replace with qa Client secret
    redirectUri: 'https://localhost:3000/callback', // Remains same or replace it as necessary
    oAuthBaseUrl: 'https://oauthasservices-g1c49ajwmr.us3.hana.ondemand.com', //Remains same or replace it as necessary
    oDataEndPoint: 'https://gwaas-g1c49ajwmr.us3.hana.ondemand.com'
  },
  sandbox: {
    clientId: 'da94326e-4a70-393c-a6df-a2e1625fa3e6', // Replace with sandbox Client Id
    clientSecret: 'wweillcornellgw', // Replace with sandbox Client secret
    redirectUri: 'https://localhost:3000/callback', // Remains same or replace it as necessary
    oAuthBaseUrl: 'https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com', //Remains same or replace it as necessary
    oDataEndPoint: 'https://gwaas-b7mbepvdgi.us3.hana.ondemand.com'
  },
  prod: {
    clientId: 'a4da749f-2a02-3f9f-b52e-305a9be40047', // Replace with production Client Id
    clientSecret: 'wweillcornellgw', // Replace with production Client secret
    redirectUri: 'https://localhost:3000/callback', // Remains same or replace it as necessary
    oAuthBaseUrl: 'https://oauthasservices-k9wo0pc2vp.us3.hana.ondemand.com', //Remains same or replace it as necessary
    oDataEndPoint: 'https://gwaas-k9wo0pc2vp.us3.hana.ondemand.com'
  }
}
