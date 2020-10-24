let mqtt, request, crypto, client, token, clientID, key, iv, id, pwd, topic, payload, valid = true, host

crypto = require('crypto')
mqtt = require('mqtt')
request = require('sync-request')
clientID = '5665920'
host = '192.168.137.10'
topic = 'home'

let connect = function () {
    if (valid) {
        client = mqtt.connect('mqtt://' + host, {
            port: 1883,
            clientId: clientID
        })

        client.on('connect', function () {
            console.log('Connected')
            setInterval(function () {
                topic = clientID + '/' + topic
                payload = {
                    protocol: client.options.protocol,
                    timestamp: new Date().getTime().toString(),
                    topic: topic,
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
            }, 5000);
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
        token = decrypt(response.body.toString())
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

if (require.main === module) {
    connect(token)
}