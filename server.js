let start, configure, app, logger, coap, consign, session, bodyParser, cookieParser,
    argv, setup, setupAscoltatore, redis, coapServer, fs, https, SQLiteStore;

coap = require('coap')
mqtt = require('mqtt')
express = require('express')()
session = require('express-session')
module.exports.app = app = require('http').Server(express)
io = require('socket.io')(app)
//MongoStore = require('connect-mongo')(session)
SQLiteStore = require('connect-sqlite3')(session);
consign = require('consign')
ascoltatori = require('ascoltatori')
redis = require('redis')
bodyParser = require('body-parser')
cookieParser = require('cookie-parser')
app.redis = {}
fs = require('fs')
https = require('https').createServer({
    key: fs.readFileSync('cert/server.key'),
    cert: fs.readFileSync('cert/server.cert')
}, express)


module.exports.setupAscoltatore = setupAscoltatore = (opts) => {
    if (opts == null) {
        opts = {}
    }
    app.ascoltatore = new ascoltatori.RedisAscoltatore({
        redis: redis,
        port: opts.port,
        host: opts.host,
        db: opts.db
    })
    return app.ascoltatore
}

module.exports.setup = setup = (opts) => {
    let args
    if (opts == null) {
        opts = {}
    }
    args = [opts.port, opts.host]
    app.redis.client = redis.createClient.apply(redis, args)
    app.redis.client.select(opts.db || 0)
    return setupAscoltatore(opts)
}

module.exports.configure = configure = () => {
    return consign({ cwd: 'libs', verbose: false })
        .include('models')
        .include('helpers')
        .include('controllers')
        .into(app)
}

module.exports.start = start = (opts, cb) => {
    configure()

    logger = app.helpers.winston
    argv = app.helpers.yargs

    if (opts == null) { opts = {} }
    if (cb == null) { cb = () => { } }

    opts.port || (opts.port = argv['port'])
    opts.coap || (opts.coap = argv['coap'])
    opts.mqtt || (opts.mqtt = argv['mqtt'])
    opts.http || (opts.http = argv['http'])
    opts.https || (opts.https = argv['https'])
    opts.mqttHost || (opts.mqttHost = argv['mqtt-host'])
    opts.redisPort || (opts.redisPort = argv['redis-port'])
    opts.redisHost || (opts.redisHost = argv['redis-host'])
    opts.redisDB || (opts.redisDB = argv['redis-db'])
    opts.mongoPort || (opts.mongoPort = argv['mongo-port'])
    opts.mongoHost || (opts.mongoHost = argv['mongo-host'])

    setup({
        port: opts.redisPort,
        host: opts.redisHost,
        db: opts.redisDB
    })

    // CoAP Gateway
    coapServer = coap.createServer()
    coapServer.on('request', app.controllers.coap_api).listen(opts.coap, () => {
        logger.coap('CoAP server listening on port %d in %s mode', opts.coap, process.env.NODE_ENV)
    });

    // MQTT Gateway
    mqttServer = mqtt.Server(app.controllers.mqtt_api).listen(opts.mqtt, () => {
        logger.mqtt('MQTT server listening on port %d in %s mode', opts.mqtt, process.env.NODE_ENV)
    });

    // Websocket Gateway
    app.listen(opts.port, () => {
        logger.socket('Websocket listening on port %d in %s mode', opts.port, process.env.NODE_ENV)
    });

    // HTTP Gateway
    express.locals.pretty = true;
    express.set('port', opts.auth);
    express.set('views', __dirname + '/libs/auth/web/views');
    express.set('view engine', 'pug');
    express.use(cookieParser());
    express.use(bodyParser.json());
    express.use(bodyParser.urlencoded({ extended: true }));
    express.use(require('express').static(__dirname + '/libs/auth/web/public'));
    express.use(session({
        secret: 'supersecret',
        proxy: true,
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 86400000 },
        store: new SQLiteStore({ db: 'database.db', table: 'sessions', dir: './libs/auth/db/' })
    }))
    express.use('/', app.controllers.http_api)
    express.listen(opts.http, () => {
        logger.http('HTTP server listening on port %d in %s mode', opts.http, process.env.NODE_ENV)
    })
    // HTTPS
    https.listen(opts.https, function () {
        logger.https('HTTPS server listening on port %d in %s mode', opts.https, process.env.NODE_ENV)
    })

    return app
}

if (require.main.filename === __filename) {
    start()
}