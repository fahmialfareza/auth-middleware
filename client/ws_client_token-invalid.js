let socket, crypto, request, key, id, iv, pwd, token, topic, io, client_id, valid = true, host

crypto = require('crypto')
io = require('socket.io-client')
request = require('sync-request')
// key = '1b743674584dd02e7cf0ad9678edb53b'
// iv = '372a10454eafff52515fbbb7d3eb716f'
id = '64f11ed3cb56563ff9639011d56ca814b28ba9f729666a95b863b28ab0674b3c'
pwd = '8a7d97771d92a95de461e2211f038b53ef1780c6e2038a1460ab9847aee9692d'
client_id = 'ws_74145d49'
host = '192.168.137.10'
//topic = 'home'

let connect = function (token) {
    //    setInterval(function () {
    if (valid) {
        socket = io.connect('http://' + host + ':' + 3000, {
            reconnect: true,
            query: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VfaWQiOiI2NGYxMWVkM2NiNTY1NjNmZjk2MzkwMTFkNTZjYTgxNGIyOGJhOWY3Mjk2NjZhOTViODYzYjI4YWIwNjc0YjNjIiwiZGV2aWNlX25hbWUiOiJwcm9ncmFtLXdzIiwidGltZXN0YW1wIjoiMTU2MTU3NTYyMzI1MyIsInJvbGUiOiJzdWJzY3JpYmVyIiwiaWF0IjoxNTYxNTc1NjIzLCJleHAiOjE1NjE1NzU2NjgsImlzcyI6ImFkaXR5YWNwcnRtLmNvbSJ9.XVMF_CFaoPcwlkt6S511MgcZ3wO8YF8n8Z_DOGpkU50'
            }
        });

        socket.on('connect', () => {
            let topics = ['5669243/home', '5665920/home']
            topics.forEach(function (topic) {
                socket.on('/r/' + topic, (data) => {
                    console.log(data)
                })
                socket.emit('subscribe', topic);
            })
        });

        socket.on('error_msg', (reason) => {
            console.log(reason);
        })
    } else {
        token = getToken()
        connect(token)
    }
    //    }, 5000)
}

let getToken = function () {
    var response = request('POST', 'http://' + host + '/device/request', {
        json: {
            "device_id": id,
            "device_password": pwd
        },
    });
    if (response.statusCode == 200 && response.body) {
        // token = decrypt(response.body.toString())
        token = JSON.parse(response.body).token
        console.log("Got Token");
        valid = true
        return token
    } else if (response.statusCode == 401) {
        data = response.body.toString()
        console.log(data + ' - Wait 10 seconds')
        setTimeout(function () { getToken(); }, 10000)
    }
}

// let decrypt = function (cipher) {
//     let encryptedText = Buffer.from(cipher, 'hex');
//     let decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
//     let decrypted = decipher.update(encryptedText);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);
//     return decrypted.toString();
// }

// let encrypt = function (plain) {
//     let cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
//     let encrypted = cipher.update(plain);
//     encrypted = Buffer.concat([encrypted, cipher.final()]);
//     return encrypted.toString('hex')
// }

if (require.main === module) {
    connect(token)
}