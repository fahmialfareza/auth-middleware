$(document).ready(function () {

    let hc = new DashboardController();
    let av = new AccountValidator();

    let a = [];
    let user;
    $.ajax({
        url: '/api/device',
        dataType: 'json',
        error: function (request, error) {
            alert("Can't do because: " + error);
        },
        success: function (data) {
            user = data.user
            for (let i = 0; i < data.dvc.length; i++) {
                a.push(data.dvc[i])
            }
            handleView()
        }
    })

    function handleView() {
        $('#welcome-user').text('Welcome, ' + user);
        if (a.length == 0) {
            $('#page-header').html('No Device Registered')
        } else {
            for (let i = 0; i < a.length; i++) {
                let topic
                if (a[i].topic) { topic = a[i].topic }
                else { topic = "Not Available" }
                //if (a[i].role == 'subscriber') { a[i].iv = "Use Publisher IV"; a[i].key = "Use Publisher Key" }
                $('.card-columns').append('<div style="width: 101%" class="card shadow-sm"> <h5 class="card-header text-center bg-white"><a style="text-decoration:none" href="/device?id=' + a[i].device_id + '">' + a[i].device_name.toUpperCase() + '</a></h5> <form class="card-body"> <p> <a class="text-decoration-none dropdown-toggle btn btn-primary" data-toggle="collapse" href="#collapseExample' + i + '" role="button" aria-expanded="false" aria-controls="collapseExample">Security Information </a> </p><div class="collapse" id="collapseExample' + i + '"> <div class="form-group"> <label>Device ID</label> <textarea style="resize: none;" class="form-control" disabled>' + a[i].device_id + '</textarea> </div><div class="form-group"> <label>Device Password</label> <textarea style="resize: none;" class="form-control" disabled>' + a[i].device_password + '</textarea> </div><div class="form-group"> <label>Key (hex)</label> <input class="form-control" type="text" value="' + a[i].key + '" disabled/> </div><div class="form-group"> <label>IV (hex)</label> <input class="form-control" type="text" value="' + a[i].iv + '" disabled/> </div></div><hr> <div class="form-group"> <label>Role</label> <input class="form-control" type="text" value="' + a[i].role + '" disabled/> </div><div class="form-group"> <label>Topic</label> <input class="form-control" type="text" value="' + topic + '" disabled/> </div><div class="form-group"> <label>Description</label> <input class="form-control" type="text" value="' + a[i].description + '" disabled/> </div></form> <div class="card-footer text-center"> <small class="text-muted">Added ' + a[i].date + '</small> </div></div>')
            }
        }
    }

    $('#account-form').ajaxForm({
        beforeSubmit: function (formData, jqForm, options) {
            if (av.validateForm() == false) {
                return false;
            } else {
                // push the disabled username field onto the form data array //
                formData.push({ name: 'user', value: $('#user-tf').val() })
                return true;
            }
        },
        success: function (responseText, status, xhr, $form) {
            if (status == 'success') hc.onUpdateSuccess();
        },
        error: function (e) {
            if (e.responseText == 'email-taken') {
                av.showInvalidEmail();
            } else if (e.responseText == 'username-taken') {
                av.showInvalidUserName();
            }
        }
    });
    // $('#name-tf').focus();

    // customize the account settings form //
    $('#account-form-btn1').html('Delete');
    $('#account-form-btn1').removeClass('btn-outline-dark');
    $('#account-form-btn1').addClass('btn-danger');
    $('#account-form-btn2').html('Update');

    // setup the confirm window that displays when the user chooses to delete their account //
    $('.modal-confirm').modal({ show: false, keyboard: true, backdrop: true });
    $('.modal-confirm .modal-header h4').text('Delete Account');
    $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
    $('.modal-confirm .cancel').html('Cancel');
    $('.modal-confirm .submit').html('Delete');
    $('.modal-confirm .submit').addClass('btn-danger');
})