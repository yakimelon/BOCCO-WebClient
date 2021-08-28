class BOCCO {
    constructor(accessToken = '') {
        this.accessToken = accessToken;
    }

    async fetchAccessToken(email, password, apiKey) {
        const response = await axios.request({
            method: 'post',
            url: this._fetchApiUrl('session'),
            data: {email: email, password: password, apikey: apiKey},
            header: {'Content-Type': 'application/json'}
        });
        this.accessToken = response.data.access_token;
        return this.accessToken;
    }

    async fetchRoom() {
        return axios.request({
            method: 'get',
            url: this._fetchApiUrl('rooms'),
            params: {access_token: this.accessToken},
            header: {'Content-Type': 'application/json'}
        });
    }

    async fetchMessage(roomId) {
        return axios.request({
           method: 'get',
           url: this._fetchApiUrl('messages'),
           params: {access_token: this.accessToken, room_id: roomId}
        });
    }

    fetchAudioLink(voiceUrl) {
        return voiceUrl + "?access_token=" + this.accessToken;
    }

    async postVoice(roomId, blob) {
        const data = new FormData();
        data.append("audio", blob, "voice.wav");
        data.append("access_token", this.accessToken);
        data.append("room_id", roomId);
        data.append("media", "audio");
        const header = {"content-type": "multipart/form-data"};

        return axios.post(this._fetchApiUrl("voice"), data, { header: header });
    }

    _fetchApiUrl(path) {
        const ENDPOINT = "https://us-central1-bocco-api.cloudfunctions.net/";
        return ENDPOINT + path
    }
}