const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const axios = require('axios');

exports.session = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        if (request.method !== 'POST') return response.status(405).end();

        try {
            const body = request.body;
            const res = await axios.request({
                method: 'post',
                url: 'https://api.bocco.me/alpha/sessions',
                params: {email: body.email, password: body.password, apikey: body.apikey},
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });

            response.status(res.status).json(res.data);
        } catch (error) {
            response.status(400).json(error);
        }
    });
});