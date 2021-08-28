const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const axios = require('axios');

exports.messages = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        if (request.method !== 'GET') return response.status(405).end();

        const query = request.query;
        const url = "https://api.bocco.me/alpha/rooms/" + query.room_id + "/messages";

        try {
            const res = await axios.request({
                method: 'get',
                url: url,
                params: {access_token: query.access_token, read: 1}
            });

            response.status(res.status).json(res.data);
        } catch (error) {
            response.status(400).json(error);
        }
    });
});
