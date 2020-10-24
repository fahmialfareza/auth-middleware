let mqtt, request, crypto, client, token, clientID, key, iv, id, pwd, topic, payload, valid = false, host

crypto = require('crypto')
mqtt = require('mqtt')
request = require('sync-request')
clientID = '5665920'
key = "7f9d684d4f343c1449956fdb326a36a1"
iv = "da646191c1b3963d9c7d7ab804b5409a"
id = "05693c53e99f144585513e5809be9d08a912f2c6d8859b20a97bd187cfc82d98"
pwd = "292a66d43de240ef04e89284b900ce80cb2e9abdf78e7103fc66975918a8618a"
host = '192.168.0.14'
topic = 'home'

let connect = function (token) {
    if (valid) {
        client = mqtt.connect('mqtt://' + host, {
            port: 1883,
            username: token,
            password: '',
            clientId: clientID
        })

        client.on('connect', function () {
            console.log('Connected')
            setInterval(function () {
                payload = {
                    protocol: client.options.protocol,
                    timestamp: new Date().getTime().toString(),
                    topic: clientID + '/' + topic,
                    humidity: {
                        value: Math.floor(Math.random() * 100),
                        unit: "string"
                    },
                    temperature: {
                        value: Math.floor(Math.random() * 100),
                        unit: "string"
                    }
                }
                client.publish(topic, JSON.stringify(payload), { qos: 1 });
                console.log('Message Sent ' + topic);
            }, 10000);
        })

        client.on('close', (error) => {
            if (error) console.log(error.toString())
            client.end(true)
        });

        client.on('error', (error) => {
            if (error) console.log(error.toString())
            client.end(true)
        })

        client.on('message', function (topic, message) {
            console.log(message.toString())
            client.end()
        })
    } else {
        token = getToken()
        connect(token)
    }
}

let getToken = function () {
    var response = request('POST', 'http://' + host + '/device/request', {
        json: {
            "device_id": id,
            "device_password": pwd
        },
    });
    if (response.statusCode == 200 && response.body) {
        //token = decrypt(response.body.toString())
        token = JSON.parse(response.body).token
        console.log(token)
        console.log("Got Token");
        valid = true
        return token
    } else if (response.statusCode == 401) {
        data = response.body.toString()
        console.log(data)
        console.log("Wait 10 seconds");
        setTimeout(function () { getToken(); }, 10000)
    }
}

let decrypt = function (cipher) {
    let encryptedText = Buffer.from(cipher, 'hex');
    let decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

let encrypt = function (plain) {
    let cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(plain);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex')
}

if (require.main === module) {
    connect(token)
}