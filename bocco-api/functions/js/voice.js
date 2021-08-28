const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const FormData = require("form-data");
const uuid = require('node-uuid');
const Busboy = require('busboy');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');


// ストリームを閉じてファイルを削除する
function closeStreamAndRemoveFile(file, originFilePath, convertedFilePath) {
    file.destroy();
    fs.unlinkSync(originFilePath);
    fs.unlinkSync(convertedFilePath);
}

// bocco-web API にリクエストを送る
async function postRequest(file, roomId, accessToken) {
    const url = "https://api.bocco.me/alpha/rooms/" + roomId + "/messages";
    const form = new FormData();
    form.append('audio', file);
    form.append('access_token', accessToken);
    form.append('media', 'audio');
    form.append('unique_id', uuid.v4());

    const config = { headers: {
        "Accept-Language": "ja",
        ...form.getHeaders()
    } };

    return axios.post(url, form, config);
}

// ffmpeg のコマンドを組み立てる
function buildFfmpegCommand(originalFilePath, convertedFilePath) {
    return ffmpeg(originalFilePath)
        .setFfmpegPath(ffmpeg_static)
        .format('mp3')
        .output(convertedFilePath);
}

exports.voice = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        if (request.method !== 'POST') {
            return response.status(405).end();
        }

        // 文字列データを取得する
        const fields = {};
        const busboy = new Busboy({headers: request.headers});
        busboy.on('field', (key, val) => {
            fields[key] = val
        });

        // ファイル書き込みの Promise を保持
        const fileWrites = [];

        // tmpdir に保存されたファイルのパス一覧を保持
        let originalFileName = "";
        let originalFilePath = "";

        busboy.on('file', (_, file, filename) => {
            // ファイルパスを保持
            const tmpdir = os.tmpdir();
            const filepath = path.join(tmpdir, filename);
            originalFileName = filename;
            originalFilePath = filepath;

            // ストリームを関連付けてファイルを書き込む
            const writeStream = fs.createWriteStream(originalFilePath);
            file.pipe(writeStream);

            // ファイル書き込み完了時の処理
            const promise = new Promise((resolve, reject) => {
                file.on('end', () => { writeStream.end(); });
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            // promiseを保持
            fileWrites.push(promise);
        });

        busboy.on('finish', async () => {
            await Promise.all(fileWrites);

            // ffmpegコマンドの組み立て、実行
            const convertedFilePath = path.join(os.tmpdir(), "converted_voice.m4a");
            const command = buildFfmpegCommand(originalFilePath, convertedFilePath);
            await new Promise((resolve, reject) => {
                command.on('end', resolve).on('error', reject).run();
            });

            // bocco-web API へ音声を POST する
            const convertedFile = fs.createReadStream(convertedFilePath);
            try {
                const res = await postRequest(convertedFile, fields["room_id"], fields["access_token"]);
                closeStreamAndRemoveFile(convertedFile, originalFilePath, convertedFilePath);
                response.status(res.status).json(res.data);
            } catch (error) {
                closeStreamAndRemoveFile(convertedFile, originalFilePath, convertedFilePath);
                console.log("error: ", error);
                response.status(400).json(error);
            }
        });

        busboy.end(request.rawBody);
    });
});