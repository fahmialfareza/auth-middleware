$(document).ready(function () {

    let rdc = new RegisterController();
    let rv = new RegisterValidator();

    $('#register-form').ajaxForm({
        beforeSubmit: function (formData, jqForm, options) {
            return rv.validateForm();
        },
        success: function (responseText, status, xhr, $form) {
            if (status == 'success') $('.modal-alert').modal('show');
        },
        error: function (err) {
            if (err.responseText == 'device-name-taken') {
                rv.showInvalidName();
            }
        }
    });

    $('#name-tf').focus();

    // customize the account settings form //
    $('#register-form h2').text('Device Registration');
    $('#register-form #sub').text('Register your device.');
    $('#head-collapse').hide();
    $('#id-lb').hide();
    $('#id-tf').hide();
    $('#pwd-lb').hide();
    $('#pwd-tf').hide();
    $('#key-lb').hide();
    $('#key-tf').hide();
    $('#iv-lb').hide();
    $('#iv-tf').hide();
    $('#register-form-btn1').html('Cancel');
    $('#register-form-btn2').html('Submit');
    $('#register-form-btn2').addClass('btn-primary');
    $('#register-form-btn3').hide();

    // setup the alert that displays when an account is successfully created //
    $('.modal-alert').modal({ show: false, keyboard: false, backdrop: 'static' });
    $('.modal-alert .modal-header h4').text('Account Created!');
    $('.modal-alert .modal-body p').html('Your device has been registered.</br>Click OK to return to the device list page.');

})