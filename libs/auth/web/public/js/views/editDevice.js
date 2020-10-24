$(document).ready(function () {

    let rc = new RegisterController();
    let rv = new RegisterValidator();

    $('#register-form').ajaxForm({
        beforeSubmit: function (formData, jqForm, options) {
            if (rv.validateForm() == false) {
                return false;
            } else {
                // push the disabled username field onto the form data array //
                formData.push({ name: 'device_id', value: $('#id-tf').val() })
                return true;
            }
        },
        success: function (responseText, status, xhr, $form) {
            if (status == 'success') rc.onUpdateSuccess();
        },
        error: function (err) {
            if (err.responseText == 'device-name-taken') {
                rv.showInvalidName();
            }
        }
    });

    // customize the account settings form //
    $('#register-form h2').text('Device Setting');
    $('#register-form #sub').text('Here are the current settings for your device.');
    $('#id-tf').attr('disabled', 'disabled');
    $('#pwd-tf').attr('disabled', 'disabled');
    $('#key-tf').attr('disabled', 'disabled');
    $('#iv-tf').attr('disabled', 'disabled');
    $('#name-tf').attr('disabled', 'disabled');
    $('#register-form-btn1').html('Cancel');
    $('#register-form-btn2').html('Update');
    $('#register-form-btn2').addClass('btn-primary');
    $('#register-form-btn3').html('Delete');
    $('#register-form-btn3').removeClass('btn-outline-dark');
    $('#register-form-btn3').addClass('btn-danger');

    // setup the confirm window that displays when the user chooses to delete their account //
    $('.modal-confirm').modal({ show: false, keyboard: true, backdrop: true });
    $('.modal-confirm .modal-header h4').text('Delete Device');
    $('.modal-confirm .modal-body p').html('Are you sure you want to delete your device?');
    $('.modal-confirm .cancel').html('Cancel');
    $('.modal-confirm .submit').html('Delete');
    $('.modal-confirm .submit').addClass('btn-danger');
})