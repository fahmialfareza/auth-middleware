
function DashboardController() {
	// bind event listeners to button clicks //
	let that = this;

	// handle user logout //
	$('#btn-logout').click(function () { that.attemptLogout(); });

	// confirm account deletion //
	$('#account-form-btn1').click(function () { $('.modal-confirm').modal('show') });

	// handle account deletion //
	$('.modal-confirm .submit').click(function () { that.deleteAccount(); });

	$('#btn-device').click(function () { window.location.href = '/device'; });

	$('#btn-add-device').click(function () { window.location.href = '/register'; });

	$('#btn-print').click(function () { window.location.href = '/print'; });

	this.deleteAccount = function () {
		$('.modal-confirm').modal('hide');
		let that = this;
		$.ajax({
			url: '/delete',
			type: 'POST',
			success: function (data) {
				that.showLockedAlert('Your account has been deleted.<br>Redirecting you back to the homepage.');
			},
			error: function (jqXHR) {
				console.log(jqXHR.responseText + ' :: ' + jqXHR.statusText);
			}
		});
	}

	this.attemptLogout = function () {
		let that = this;
		$.ajax({
			url: '/logout',
			type: 'POST',
			data: { logout: true },
			success: function (data) {
				that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
			},
			error: function (jqXHR) {
				console.log(jqXHR.responseText + ' :: ' + jqXHR.statusText);
			}
		});
	}

	this.showLockedAlert = function (msg) {
		$('.modal-alert').modal({ show: false, keyboard: false, backdrop: 'static' });
		$('.modal-alert .modal-header h4').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function () { window.location.href = '/'; })
		setTimeout(function () { window.location.href = '/'; }, 3000);
	}
}

DashboardController.prototype.onUpdateSuccess = function () {
	$('.modal-alert').modal({ show: false, keyboard: true, backdrop: true });
	$('.modal-alert .modal-header h4').text('Success!');
	$('.modal-alert .modal-body p').html('Your account has been updated.');
	$('.modal-alert').modal('show');
	$('.modal-alert button').click(function () { window.location.href = '/'; })
	setTimeout(function () { window.location.href = '/'; }, 3000);
}
