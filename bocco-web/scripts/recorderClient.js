// 参考: https://github.com/s1r-J/Recorderjs
class RecorderClient {
    constructor() {
        this.recorder = null;
        this._init();
    }

    start() {
        this.recorder && this.recorder.record();
    }

    // callback(blob)
    stop(callback) {
        this.recorder && this.recorder.stop();
        this.recorder && this.recorder.exportWAV(callback);
        this.recorder.clear();
    }

    _init() {
        let audio_context;
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }

        // getUserMedia対応かどうか検証
        try {
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                    if (!getUserMedia) {
                        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                    }

                    return new Promise(function(resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            }
            window.URL = window.URL || window.webkitURL;
            audio_context = new AudioContext;
        } catch (e) {
            alert('No web audio support in this browser!');
        }

        // マイクデバイスを取得
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(function(stream) {
                const input = audio_context.createMediaStreamSource(stream);
                audio_context.resume();
                this.recorder = new Recorder(input);
            }.bind(this))
            .catch(function(e) {
                alert('No live audio input: ' + e);
            });
    }
}
