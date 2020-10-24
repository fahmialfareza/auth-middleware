module.exports = (app) => {

    const logger = app.helpers.winston
    const router = require('express').Router()
    const AM = require('../auth/config/account-manager')
    const DM = require('../auth/config/device-manager')

    /* 
    Device Request
    */
    /* Device request token */
    router.route('/device/request')
        .post((req, res) => {
            logger.http('Incoming Device for %s request token from %s ', req.method, req.ip)
            let payload = req.body
            payload.ip = req.ip
            payload.timestamp = Date.now().toString()
            DM.request(payload, (err, data) => {
                if (err != null) {
                    logger.http('Not generate token for %s, %s', req.ip, err)
                    res.format({
                        'application/json': function () {
                            res.status(401).send(err);
                        }
                    })
                } else {
                    logger.http('Token generated for %s', req.ip)
                    res.format({
                        'application/json': function () {
                            res.status(200).send(data);
                        },
                    })
                }
            })
        })
        .get((req, res) => {
            logger.http('Incoming Device for %s request token from %s ', req.method, req.ip)
            res.format({
                'application/json': function () {
                    res.status(405).send({ message: 'Method Not Allowed' })
                }
            })
        })

    router.route('/device/check')
        .post((req, res) => {
            logger.http('Incoming Device for %s check token from %s ', req.method, req.ip)
        })
        .get((req, res) => {
            logger.http('Incoming Device for %s check token from %s ', req.method, req.ip)
            if (req.body.token) {
                DM.validity(req.body.token, (err, reply) => {
                    if (err != null) {
                        logger.error('There\'s an error: %s', err)
                        res.format({
                            'application/json': function () {
                                res.status(401).send(err)
                            }
                        })
                    } else {
                        if (reply.status) {
                            res.format({
                                'application/json': function () {
                                    res.status(200).send({ status: 'Valid' })
                                }
                            })
                        } else {
                            res.format({
                                'application/json': function () {
                                    res.status(200).send({ status: 'Unvalid' })
                                }
                            })
                        }
                    }
                })
            } else {
                res.format({
                    'application/json': function () {
                        res.status(200).send({ message: 'Token Not Found' })
                    }
                })
            }
        })

    /*
    User Web Request
    */
    /* Main Path */
    router.route('/')
        .get((req, res) => {
            // check if the user has an auto login key saved in a cookie //
            if (req.cookies.login == undefined) {
                res.render('login', { title: 'Hello - Please Login To Your Account' });
            } else {
                // attempt automatic login //
                AM.validateLoginKey(req.cookies.login, req.ip, function (e, o) {
                    if (o) {
                        AM.autoLogin(o.user, o.pass, function (o) {
                            req.session.user = o;
                            res.redirect('/dashboard');
                        });
                    } else {
                        res.render('login', { title: 'Login' });
                    }
                });
            }
        })
        .post((req, res) => {
            AM.manualLogin(req.body['user'], req.body['pass'], function (e, o) {
                if (!o) {
                    res.status(400).send(e);
                } else {
                    req.session.user = o;
                    AM.generateLoginKey(o.username, req.ip, function (key) {
                        logger.http('User %s has login', req.session.user.username)
                        res.cookie('login', key, { maxAge: 900000 });
                        res.status(200).send(o);
                    });
                }
            });
        })

    /* SignUp path */
    router.route('/signup')
        .get((req, res) => {
            res.render('signup', { title: 'Signup' });
        })
        .post((req, res) => {
            AM.addNewAccount({
                name: req.body['name'],
                email: req.body['email'],
                user: req.body['user'],
                pass: req.body['pass'],
                admin: false
            }, function (err) {
                if (err) {
                    res.status(400).send(err);
                } else {
                    logger.http('User %s has registered', req.body['user'])
                    res.status(200).send('ok');
                }
            });
        })

    /* Dashboard path */
    router.route('/dashboard')
        .get((req, res) => {
            if (req.session.user == null) {
                res.redirect('/');
            } else {
                let user = req.session.user.username
                DM.getDevice(user, (err, devices) => {
                    res.render('dashboard', {
                        title: 'Dashboard',
                        dvc: devices,
                        usr: req.session.user
                    })
                })
            }
        })
        .post((req, res) => {
            if (req.session.user == null) {
                res.redirect('/');
            } else {
                AM.updateAccount({
                    id: req.session.user.id,
                    name: req.body['name'],
                    email: req.body['email'],
                    pass: req.body['pass']
                }, function (e, o) {
                    if (e) {
                        res.status(400).send('error-updating-account');
                    } else {
                        req.session.user = o;
                        logger.http('User %s has changed the account', req.session.user.username)
                        res.status(200).send('ok');
                    }
                });
            }
        })

    /* Device Path */
    router.route('/device')
        .get((req, res) => {
            if (req.session.user == null) {
                res.redirect('/');
            } else {
                if (req.query.id) {
                    let id = req.query.id
                    DM.checkId(id, (err, data) => {
                        if (data == null) {
                            res.status(400);
                            res.render('error', { title: 'Page Not Found', message: 'I\'m sorry, the page or resource you are searching for is currently unavailable.' });
                        } else {
                            res.render('editDevice', {
                                title: 'Device Update',
                                dvc: data
                            })
                        }
                    })
                } else {
                    res.render('device', { title: 'Devices' })
                }
            }
        })
        .post((req, res) => {
            if (req.session.user == null) {
                res.redirect('/');
            } else {
                if (req.query.id) {
                    DM.checkId(req.query.id, (err, o) => {
                        if (err) {
                            res.status(400).send('not-found');
                        } else {
                            DM.updateDevice({
                                device_id: req.query.id,
                                role: req.body['role'],
                                description: req.body['description']
                            }, (err, rep) => {
                                if (err) {
                                    res.status(400).send(err);
                                } else {
                                    logger.http('User %s has changed the device data', req.session.user.username)
                                    res.status(200).send('ok');
                                }
                            })
                        }
                    })
                }
            }
        })

    /* Get Device API */
    router.get('/api/device', (req, res) => {
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            let user = req.session.user.username
            DM.getDevice(user, (err, devices) => {
                res.json({ user: user, dvc: devices })
            })
        }
    })

    /* Register device path */
    router.route('/register')
        .get((req, res) => {
            if (req.session.user == null) {
                res.redirect('/');
            } else {
                let user = req.session.user.username
                res.render('addDevice', {
                    title: 'Register Device',
                })
            }
        })
        .post((req, res) => {
            DM.addDevice({
                device_name: req.body['device_name'],
                role: req.body['role'],
                description: req.body['description'],
                user: req.session.user.username
            }, (err) => {
                if (err) {
                    res.status(400).send(err);
                } else {
                    logger.http('User %s has register the device', req.session.user.username)
                    res.status(200).send('ok');
                }
            })
        })

    /* Delete Path */
    router.post('/delete', function (req, res) {
        if (req.query.id) {
            DM.deleteDevice(req.query.id, null, (err, obj) => {
                if (err != null) {
                    res.status(400).send('record not found');
                } else {
                    logger.http('User %s has deleted the device', req.session.user.username)
                    res.status(200).send('ok');
                }
            })
        } else {
            AM.deleteAccount(req.session.user.username, function (err, obj) {
                if (err != null) {
                    res.status(400).send('record not found');
                } else {
                    DM.deleteDevice(null, req.session.user.username, (err, obj) => {
                        if (err != null) {
                            res.status(400).send('record not found');
                        } else {
                            logger.http('User %s has deleted the account and devices', req.session.user.username)
                            res.clearCookie('login');
                            req.session.destroy(function (e) { res.status(200).send('ok'); });
                        }
                    })
                }
            });
        }
    });

    /* Print All User Path*/
    router.get('/print', function (req, res) {
        if (req.session.user.admin == 1) {
            AM.getAllRecords(function (e, accounts) {
                DM.getAllDevice(function (e, devices) {
                    res.render('print', { title: 'Account List', accts: accounts, dvc: devices });
                })
            })
        } else {
            res.render('error', { title: 'Forbidden', message: 'forbidden you don\'t have permission to access ' + req.path + ' on this server' })
        }
    });

    /* LogOut Path */
    router.post('/logout', (req, res) => {
        res.clearCookie('login');
        req.session.destroy(function (e) { res.status(200).send('ok'); });
    })

    /* Error path handler */
    router.get('*', function (req, res) { res.render('error', { title: 'Page Not Found', message: 'I\'m sorry, the page or resource you are searching for is currently unavailable.' }); });

    return router
}
