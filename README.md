# BOCCO-WebClient

BOCCO API に web からアクセスする最低限のクライアント。  
BOCCO API はブラウザからのクロスドメインの通信に対応していないため、  
Firebase Cloud Functions で中継してリクエストを送る。

目的は BOCCO との「音声通信」を実現するためで、  
現状の機能も音声通信に関わるものに限定されている。

公式ドキュメント: http://api-docs.bocco.me/index.html

# 機能概要

- メールアドレス/パスワード/APIキーから `access_token` を取得する
- access_token からルーム情報を取得する
- access_token と room_id から全てのメッセージを取得する
- ブラウザで録音した音声を BOCCO API へ送信する

# 利用方法

- API検証用Webページ: https://yakimelon.github.io/BOCCO-WebClient/bocco-web/
- 中継APIのエンドポイント: https://us-central1-bocco-api.cloudfunctions.net/

中継APIを web で使うための SDK と依存関係。
```html
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/s1r-J/Recorderjs/dist/recorder.js"></script>
<script src="https://cdn.jsdelivr.net/gh/yakimelon/BOCCO-WebClient@76d8aeec782057d7d47f9b96ac4e2b587f3e74a6/bocco-web/scripts/bocco.js"></script>
<script src="https://cdn.jsdelivr.net/gh/yakimelon/BOCCO-WebClient@76d8aeec782057d7d47f9b96ac4e2b587f3e74a6/bocco-web/scripts/recorderClient.js"></script>
```

スクリプト例は下記の通り。

```js
const bocco = new BOCCO();

// アクセストークンを取得 (boccoオブジェクトで保持されます)
await bocco.fetchAccessToken(email, password, apikey);

// ルームIDを取得
const response = await bocco.fetchRoom();
const roomId = response.data[0].uuid;

// 最新のBOCCOメッセージの音声のURLを取得
const response = await bocco.fetchMessage(roomId);
const voiceUrl = response.data.filter((x) => {
    return x.user.user_type === "bocco"
}).pop().audio;
const voiceSrc = bocco.fetchAudioLink(voiceUrl);

// ブラウザで録音した音声を BOCCO へ送信する (start - stopが呼び出されるまでの間録音される)
const recorderClient = new RecorderClient();
recorderClient.start();
recorderClient.stop(async (blob) => {
    await bocco.postVoice(roomId, blob);
});
```

# API一覧

|API|機能|元API|
|---|---|---|
|POST /session|access_tokenを取得|/sessions|
|GET /rooms|Room IDを取得|rooms/joined|
|GET /messages|メッセージを取得|rooms/[ROOM ID]/messages|
|POST /voice|音声メッセージを送信|rooms/[ROOM ID]/messages|

# ディレクトリ構成

- bocco-api: BOCCO API を中継する API
- bocco-web: ブラウザから BOCCO API へ通信する最小限のクライアント
