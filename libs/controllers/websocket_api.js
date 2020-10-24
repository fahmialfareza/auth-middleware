module.exports = (app) => {

    const logger = app.helpers.winston
    const Data = app.models.Data
    const DM = require('../auth/config/device-manager')

    return io.on('connection', (socket) => {
        let token, authorized, subscriptions, subscription

        if (socket.handshake.query && socket.handshake.query.token) {
            token = socket.handshake.query.token
            //logger.socket('Client %s connecting . . .', socket.id)
            DM.validity(token, (err, reply) => {
                if (err != null) {
                    logger.error('There\'s an error: %s', err)
                    socket.emit('error_msg', err.message)
                    socket.disconnect()
                } else {
                    authorized = reply.status
                    if (authorized) {
                        logger.socket('Client %s has connected', socket.id)
                        if (reply.data.role == 'subscriber') {
                            subscriptions = {}
                            socket.on('subscribe', (topic) => {
                                logger.socket('Client %s subscribe to %s ', socket.id, topic)
                                subscription = (currentData) => {
                                    let stringValue = null
                                    if (currentData.value.type === 'Buffer' || currentData.value instanceof Buffer) {
                                        stringValue = new Buffer.from(currentData.value).toString()
                                    } else {
                                        stringValue = currentData.value
                                    }
                                    return socket.emit('/r/' + topic, stringValue)
                                }
                                subscriptions[topic] = subscription
                                Data.subscribe(topic, subscription)
                                return Data.find(topic, (err, data) => {
                                    if (err) logger.error(err)
                                    if ((data != null ? data.value : void 0) != null) {
                                        return subscription(data)
                                    }
                                })
                            });
                        } else {
                            logger.socket('Client %s does not match the role', socket.id)
                            socket.emit('error_msg', 'Does not match the role')
                            socket.disconnect()
                        }
                    } else {
                        logger.socket('Client %s has refused', socket.id)
                        socket.emit('error_msg', 'There\'s an Error')
                        socket.disconnect()
                    }
                }
            })
        }

        return socket.on('disconnect', () => {
            logger.socket('Client %s has disconnected', socket.id)
            let listener, results, topic
            results = []
            for (topic in subscriptions) {
                listener = subscriptions[topic]
                results.push(Data.unsubscribe(topic, listener))
            }
            return results
        })
    })
}