Template.loginDialog.events({
    'shown.bs.modal #loginDialog': function (e, t) {
        Tracker.afterFlush(function () {
            t.$("#loginEmail").focus();
        });

    },
    'submit #loginDialogForm': function (event, template) {
        event.preventDefault();
        Meteor.loginWithPassword(template.find("#loginEmail").value, template.find("#loginPassword").value, function (err) {
            if (err) {
                Session.set("loginMessage", {
                    type: 'danger',
                    msg: 'Anmelden fehlgeschlagen:' + err
                });
            } else {
                Session.set("loginMessage", undefined);
                Tracker.afterFlush(function () {
                    $('#loginDialog').modal('hide');
                });
            }
        });
    },
    'click .btn-register': function (e) {
        e.preventDefault();
        $('#loginDialog').one('hidden.bs.modal', function () {
            UltiSite.showModal('userCreateDialog');
        });
        $('#loginDialog').modal('hide');
    },
    'click .btn-password-reset': function (event, template) {
        if (template.find("#loginEmail").value.length < 3) {
            Session.set("loginMessage", {
                type: 'danger',
                msg: 'Gib deine E-Mail Adresse ein, um dein Passwort zurückzusetzen:'
            });
            return;
        }
        if (!confirm("Wenn sie Ok klicken, wird eine E-Mail an ihre E-Mail Adresse geschickt, mit einem Link um ein neues Passwort zu setzen"))
            return;
        Meteor.call("passwordReset", template.find("#loginEmail").value);
        $('#loginDialog').modal('hide');
        Session.set("loginMessage", undefined);
    }
});

Template.loginDialog.helpers({
    message: function () {
        return Session.get("loginMessage");
    },
    loggingIn: function() {
        return Meteor.loggingIn();
    }
});

Accounts.onResetPasswordLink(function (token) {
    Session.set("passwordResetToken", token);
});

Accounts.onEnrollmentLink(function (token) {
    Session.set("passwordResetToken", token);
});

Template.passwordResetDialog.rendered = function () {
    if(Session.get("passwordResetToken"))
        $('#passwordReset').modal('show');
};

Template.passwordResetDialog.helpers({
    token: function () {
        return Session.get("passwordResetToken");
    }
});

Template.passwordResetDialog.events({
    'submit form': function (event, template) {
        event.preventDefault();
        console.log("resetting password:" + template.find("#token").value);
        var password = template.find('#password').value;
        var token = template.find("#token").value;
        Accounts.resetPassword(token, password, UltiSite.userFeedbackFunction("Bestätigung der E-Mail Adresse",null, function () {
            Session.set("passwordResetToken", undefined);
            $('#passwordReset').modal('hide');
        }));
    },
    'click .close': function () {
        Session.set("passwordResetToken", undefined);
    }
});

Template.passwordChangeDialog.events({
    'submit form': function (event, template) {
        event.preventDefault();
        var oldPassword = template.find('#oldPassword').value;
        var newPassword = template.find('#newPassword').value;
        var newPassword2 = template.find('#newPassword2').value;
        if(newPassword2 !== newPassword)
            UltiSite.notify("Passwörter stimmen nicht überein!","error");
        else
        Accounts.changePassword(oldPassword, newPassword, UltiSite.userFeedbackFunction("Neues Passwort setzen",$('#oldPassword'), function () {
            $('#passwordChange').modal('hide');
        }));
    },
});
