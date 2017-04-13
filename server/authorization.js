Meteor.startup(function () {
    Accounts.validateLoginAttempt(function (attempt) {
        if (attempt.user) {
            if ((UltiSite.settings().siteRegistration === 'admin') && attempt.user.profile.unverified)
                throw new Meteor.Error("login-failed", "The user is not verified by a Site Admin");
        }
        return true;
    });
});

Meteor.methods({
    passwordReset: function (email) {
        check(email, String);
        var user = Meteor.users.findOne({
            'emails.address': email
        }, {
            fields: {
                _id: 1
            }
        });
        if (user) {
            console.log("Sending mail to:",email);
            var token = createEmailVerificationToken(user._id,email);
            UltiSite.Mail.send([user._id],"Passwort Zurücksetzen",
                "Bitte klicke den Link: "+
                Meteor.absoluteUrl("#/reset-password/"+token)+
                " um dein Passwort zurückzusetzen");
        }
    },
    userVerification: function (userId, accept) {
        if (!UltiSite.isAdmin(this.userId))
            return;
        console.log("userVerification", userId, accept);
        if (accept)
            Meteor.users.update({
                _id: userId
            }, {
                $set: {
                    'profile.verifiedBy': this.userId
                },
                $unset: {
                    'profile.unverified': ""
                }
            },function(){
                var email = Meteor.users.findOne(userId).emails[0].address;
                var token = createEmailVerificationToken(userId,email);
                console.log("Created token:",token);

                UltiSite.Mail.send([userId],"E-Mail Verifizierung",
                    "Bitte klicke den Link: "+UltiSite.hostname() + "/#/enroll-account/"+(token));
                console.log("Sent email");
            });
        else
            Meteor.users.remove({
                _id: userId
            });
    },
    addUser: function (userData) {
        var profile = {
            name: userData.name,
            surname: userData.surname,
            sex: userData.sex
        };
        profile.clubProperties = {};
        if(Meteor.users.find().count() > 0) {
            if(!this.userId) {
                // we need to check the registration password
                if(UltiSite.settings().siteRegistration==='password') {
                    if(!userData.sitePassword)
                        throw new Meteor.Error("wrong-password", "Ein Registrierungspasswort muss angegeben werden");

                    if(userData.sitePassword !== UltiSite.settings().sitePassword)
                        throw new Meteor.Error("wrong-password", "Das Registrierungspasswort ist falsch");
                }
            }
            var user = Meteor.users.findOne({
                'emails.address': userData.email
            }, {
                fields: {
                    _id: 1
                }
            });
            if (user)
                throw new Meteor.Error("duplicate-email", "Ein Nutzer mit dieser E-Mail Adresse existiert bereits");
            var alias = {};
            user = Meteor.users.findOne({username:{$regex:userData.alias,$options:'i'}}, {
                fields: {
                    _id: 1
                }
            });
            if (user)
                throw new Meteor.Error("duplicate-username", "Ein Nutzer mit diesem Nuiternamen existiert bereits");
            if (UltiSite.isAdmin(this.userId))
                profile.verifiedBy = this.userId;
            else
                profile.unverified = true;
        } else {
            
        }
        console.log("Input data ok, creating user");
        
        var userId = Accounts.createUser({
            username: userData.alias,
            email: userData.email,
            profile: profile
        });
        if(Meteor.users.find().count()===1) {
            Accounts.setPassword(userId, "blubs");
            Roles.addUsersToRoles(Meteor.users.findOne(userId), ['admin', 'club']);
        } else {
            console.log("Created user:",userId,userData.email);
            // send enrollment link to new user if a admin adds a new one
            if(UltiSite.settings().siteRegistration !== "admin") {
                var token = createEmailVerificationToken(userId,userData.email);
                console.log("Created token:",token);

                UltiSite.Mail.send([userId],"E-Mail Verifizierung",
                    "Bitte klicke den Link: "+UltiSite.hostname() + "/#/enroll-account/"+(token));
                console.log("Sent email");
            }
        }
    }
});

function createEmailVerificationToken(userId,email) {
    var user = Meteor.users.findOne(userId);
    if(!user)
        throw new Meteor.Error("auth-err","No user found");

    if(!_.contains(_.pluck(user.emails||[],'address'),email))
        throw new Meteor.Error("auth-err","No email found");
    var tokenRecord = {
        token: Random.secret(),
        email: email,
        when: new Date()
    };

    Meteor.users.update(userId,{
        $set:{
            "services.password.reset":tokenRecord
        }
    });
    return tokenRecord.token;

}
