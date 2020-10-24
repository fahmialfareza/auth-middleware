let mqtt, request, client, token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZpY2VfaWQiOiIwNTY5M2M1M2U5OWYxNDQ1ODU1MTNlNTgwOWJlOWQwOGE5MTJmMmM2ZDg4NTliMjBhOTdiZDE4N2NmYzgyZDk4IiwiZGV2aWNlX25hbWUiOiJub2RlbWN1LW1xdHQiLCJ0aW1lc3RhbXAiOiIxNTYxNTc0NzYxOTQ0Iiwicm9sZSI6InB1Ymxpc2hlciIsImlhdCI6MTU2MTU3NDc2MSwiZXhwIjoxNTYxNTc0ODA2LCJpc3MiOiJhZGl0eWFjcHJ0bS5jb20ifQ.iSs7PsLeiqX8PKtCFIGDZJQZIl4fqSz8ghlJI7FUjwU', clientID, key, iv, id, pwd, topic, payload, valid = true, host

mqtt = require('mqtt')
request = require('sync-request')
clientID = '5665920'
id = "05693c53e99f144585513e5809be9d08a912f2c6d8859b20a97bd187cfc82d98"
pwd = "292a66d43de240ef04e89284b900ce80cb2e9abdf78e7103fc66975918a8618a"
host = '192.168.137.10'
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
        //token = decrypt(response.body.toString())
        token = JSON.parse(response.body).token
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