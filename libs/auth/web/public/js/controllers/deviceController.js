
function DeviceController() {
	// bind event listeners to button clicks //
	let that = this;

	// handle user logout //
	$('#btn-logout').click(function () { that.attemptLogout(); });

    // handle button dashboard page
    $('#btn-dashboard').click(function () { window.location.href = '/dashboard'; });
    
    // handle button register device page
    $('#btn-add-device').click(function () { window.location.href = '/register'; });

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