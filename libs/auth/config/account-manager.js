const crypto = require('crypto');
const db = require('../db/db');

/*
	login validation methods
*/
exports.autoLogin = function (user, pass, callback) {
	db.get('SELECT password FROM accounts WHERE username=?', [user], (e, o) => {
		if (o) {
			o.pass == pass ? callback(o) : callback(null);
		} else {
			callback(null);
		}
	})
}

exports.manualLogin = function (user, pass, callback) {
	db.get('SELECT * FROM accounts WHERE username=?', [user], (e, o) => {
		if (o == null) {
			callback('user-not-found');
		} else {
			validatePassword(pass, o.password, function (err, res) {
				if (res) {
					callback(null, o);
				} else {
					callback('invalid-password');
				}
			});
		}
	})
}

exports.generateLoginKey = function (user, ipAddress, callback) {
	let cookie = guid();
	db.run('UPDATE accounts SET ip=?,cookie=? WHERE username=?', [ipAddress, cookie, user], (e, o) => {
		callback(cookie);
	});
}

exports.validateLoginKey = function (cookie, ipAddress, callback) {
	// ensure the cookie maps to the user's last recorded ip address //
	db.get('SELECT username,password FROM accounts WHERE cookie=? AND ip=?', [cookie, ipAddress], callback);
}

/*
	record insertion, update & deletion methods
*/
exports.addNewAccount = function (newData, callback) {
	db.serialize(function () {
		const query1 = 'SELECT username FROM accounts WHERE username=?';
		const query2 = 'SELECT email FROM accounts WHERE email=?';
		const query3 = 'INSERT INTO accounts (name,email,username,password,date,ip) VALUES (?,?,?,?,datetime("now", "localtime"),?)';
		db.get(query1, [newData.user], (err, row) => {
			if (err) throw err;
			if (row) {
				callback('username-taken');
			} else {
				db.get(query2, newData.email, (err, row) => {
					if (row) {
						callback('email-taken');
					} else {
						saltAndHash(newData.pass, function (hash) {
							newData.pass = hash;
							// append date stamp when record was created //
							newData.date = new Date().toLocaleString()
							db.run(query3, [newData.name, newData.email, newData.user, newData.pass, newData.ip], callback)
						});
					}
				})
			}
		})
	})
}

exports.updateAccount = function (newData, callback) {
	let findOneAndUpdate = function (data) {
		let o = {
			name: data.name,
			email: data.email,
		}
		if (data.pass) o.pass = data.pass;
		db.run('UPDATE accounts SET name=?,email=?,password=? WHERE id=?', [o.name, o.email, o.pass, data.id]);
		db.get('SELECT * FROM accounts WHERE id=?', [data.id], (e, o) => {
			callback(null, o)
		})
	}
	if (newData.pass == '') {
		findOneAndUpdate(newData);
	} else {
		saltAndHash(newData.pass, function (hash) {
			newData.pass = hash;
			findOneAndUpdate(newData);
		});
	}
}

/*
	account lookup methods
*/

exports.getAllRecords = function (callback) {
	db.all('SELECT * FROM accounts', (err, row) => {
		if (err) {
			callback(err)
		} else {
			callback(null, row)
		}
	})
}

exports.deleteAccount = function (user, callback) {
	db.run('DELETE FROM accounts WHERE username=?', user, (err, o) => {
		if (err) { callback(err, null) }
		else (callback(null, o))
	})
}

/*
	private encryption & validation methods
*/

let generateSalt = function () {
	let set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	let salt = '';
	for (let i = 0; i < 10; i++) {
		let p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

let md5 = function (str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

let saltAndHash = function (pass, callback) {
	let salt = generateSalt();
	callback(salt + md5(pass + salt));
}

let validatePassword = function (plainPass, hashedPass, callback) {
	let salt = hashedPass.substr(0, 10);
	let validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

let getObjectId = function (id) {
	return new require('mongodb').ObjectID(id);
}

const guid = function () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		let r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16);
	});
}
