Template.loginDialog.events({
  'shown.bs.modal #loginDialog'(e, t) {
    Tracker.afterFlush(function () {
      t.$("#loginEmail").focus();
    });
  },
  'submit #loginDialogForm'(event, template) {
    event.preventDefault();
    Meteor.loginWithPassword(template.find("#loginEmail").value, template.find("#loginPassword").value, function (err) {
      if (err) {
        UltiSite.State.set("loginMessage", {
          type: 'danger',
          msg: `Anmelden fehlgeschlagen:${err}`,
        });
      } else {
        UltiSite.State.set("loginMessage", undefined);
        Tracker.afterFlush(function () {
          $('#loginDialog').modal('hide');
        });
      }
    });
  },
  'click .btn-register'(e) {
    e.preventDefault();
    $('#loginDialog').one('hidden.bs.modal', function () {
      UltiSite.showModal('userCreateDialog', {}, { dynamicImport: '/imports/client/user/user.js' });
    });
    $('#loginDialog').modal('hide');
  },
  'click .btn-password-reset'(event, template) {
    if (template.find("#loginEmail").value.length < 3) {
      UltiSite.State.set("loginMessage", {
        type: 'danger',
        msg: 'Gib deine E-Mail Adresse ein, um dein Passwort zurückzusetzen:',
      });
      return;
    }
    if (!confirm("Wenn sie Ok klicken, wird eine E-Mail an ihre E-Mail Adresse geschickt, mit einem Link um ein neues Passwort zu setzen")) { return; }
    Meteor.call("passwordReset", template.find("#loginEmail").value);
    $('#loginDialog').modal('hide');
    UltiSite.State.set("loginMessage", undefined);
  },
});

Template.loginDialog.helpers({
  message() {
    return UltiSite.State.get("loginMessage");
  },
  loggingIn() {
    return Meteor.loggingIn();
  },
});

Accounts.onResetPasswordLink(function (token) {
  UltiSite.State.set("passwordResetToken", { token, type: 'reset' });
});

Accounts.onEnrollmentLink(function (token) {
  UltiSite.State.set("passwordResetToken", { token, type: 'enroll' });
});

Template.passwordResetDialog.rendered = function () {
  if (UltiSite.State.get("passwordResetToken")) { $('#passwordReset').modal('show'); }
};

Template.passwordResetDialog.helpers({
  passwordReset() {
    return UltiSite.State.get("passwordResetToken");
  },
});

Template.passwordResetDialog.events({
  'submit form'(event, template) {
    event.preventDefault();
    console.log(`resetting password:${template.find("#token").value}`);
    const password = template.find('#password').value;
    const token = template.find("#token").value;
    Accounts.resetPassword(token, password, UltiSite.userFeedbackFunction("Bestätigung der E-Mail Adresse", null, function () {
      UltiSite.State.set("passwordResetToken", undefined);
      $('#passwordReset').modal('hide');
    }));
  },
  'click .close'() {
    UltiSite.State.set("passwordResetToken", undefined);
  },
});

Template.passwordChangeDialog.events({
  'submit form'(event, template) {
    event.preventDefault();
    const oldPassword = template.find('#oldPassword').value;
    const newPassword = template.find('#newPassword').value;
    const newPassword2 = template.find('#newPassword2').value;
    if (newPassword2 !== newPassword) { UltiSite.notify("Passwörter stimmen nicht überein!", "error"); } else {
      Accounts.changePassword(oldPassword, newPassword, UltiSite.userFeedbackFunction("Neues Passwort setzen", $('#oldPassword'), function () {
        $('#passwordChange').modal('hide');
      }));
    }
  },
});
