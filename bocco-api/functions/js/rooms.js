const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const axios = require('axios');

exports.rooms = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        if (request.method !== 'GET') return response.status(405).end();

        try {
            const query = request.query;
            const res = await axios.request({
                method: 'get',
                url: 'https://api.bocco.me/alpha/rooms/joined',
                params: {access_token: query.access_token}
            });

            response.status(res.status).json(res.data);
        } catch (error) {
            response.status(400).json(error);
        }
    });
});