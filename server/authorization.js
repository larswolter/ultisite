import { hostname, isAdmin, settings } from '../common/lib/ultisite';
import { Mail } from './mail';

Meteor.startup(async function () {
  Accounts.validateLoginAttempt(function (attempt) {
    if (attempt.user) {
      if (settings().siteRegistration === 'admin' && attempt.user.profile.unverified) {
        throw new Meteor.Error('login-failed', 'The user is not verified by a Site Admin');
      }
    }
    return true;
  });
  await Meteor.users.updateAsync({ activeAdmin: true }, { $unset: { activeAdmin: true } }, { multi: true });
});

Meteor.publish(null, async function () {
  return this.userId && Meteor.users.find({ _id: this.userId }, { fields: { activeAdmin: 1 } });
});

Accounts.onLogin(async function (attempt) {
  attempt.user &&
    attempt.user._id &&
    (await Meteor.users.updateAsync(attempt.user._id, { $unset: { activeAdmin: true } }));
});

Meteor.methods({
  async makeMeAdmin() {
    check(this.userId, String);
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      await Meteor.users.updateAsync(this.userId, { $set: { activeAdmin: true } });
    }
  },
  async passwordReset(email) {
    check(email, String);
    const user = await Meteor.users.findOneAsync(
      {
        'emails.address': email,
      },
      {
        fields: {
          _id: 1,
        },
      }
    );
    if (user) {
      console.log('Sending mail to:', email);
      const token = await createEmailVerificationToken(user._id, email);
      Mail.send(
        [user._id],
        'Passwort Zurücksetzen',
        'Bitte klicke den Link: ' + Meteor.absoluteUrl('#/reset-password/' + token) + ' um dein Passwort zurückzusetzen'
      );
    }
  },
  async userVerification(userId, accept) {
    if (!(await isAdmin(this.userId))) {
      return;
    }
    console.log('userVerification', userId, accept);
    if (accept) {
      await Meteor.users.updateAsync(
        {
          _id: userId,
        },
        {
          $set: {
            'profile.verifiedBy': this.userId,
          },
          $unset: {
            'profile.unverified': '',
          },
        },
        async function () {
          const email = (await Meteor.users.findOneAsync(userId)).emails[0].address;
          const token = await createEmailVerificationToken(userId, email);
          console.log('Created token:', token);

          Mail.send(
            [userId],
            'E-Mail Verifizierung',
            'Bitte klicke den Link: ' + hostname() + '/#/enroll-account/' + token
          );
          console.log('Sent email');
        }
      );
    } else {
      await Meteor.users.removeAsync({
        _id: userId,
      });
    }
  },
  async addUser(userData) {
    const profile = {
      name: userData.name,
      surname: userData.surname,
      sex: userData.sex,
    };
    profile.clubProperties = {};
    if ((await Meteor.users.find().countAsync()) > 0) {
      if (!this.userId) {
        // we need to check the registration password
        if (settings().siteRegistration === 'password') {
          if (!userData.sitePassword) {
            throw new Meteor.Error('wrong-password', 'Ein Registrierungspasswort muss angegeben werden');
          }

          if (userData.sitePassword !== settings().sitePassword) {
            throw new Meteor.Error('wrong-password', 'Das Registrierungspasswort ist falsch');
          }
        }
      }
      let user = await Meteor.users.findOneAsync(
        {
          'emails.address': userData.email,
        },
        {
          fields: {
            _id: 1,
          },
        }
      );
      if (user) {
        throw new Meteor.Error('duplicate-email', 'Ein Nutzer mit dieser E-Mail Adresse existiert bereits');
      }
      user = await Meteor.users.findOneAsync(
        { username: { $regex: userData.alias, $options: 'i' } },
        {
          fields: {
            _id: 1,
          },
        }
      );
      if (user) {
        throw new Meteor.Error('duplicate-username', 'Ein Nutzer mit diesem Nuiternamen existiert bereits');
      }
      if (await isAdmin(this.userId)) {
        profile.verifiedBy = this.userId;
      } else {
        profile.unverified = true;
      }
    }
    console.log('Input data ok, creating user');

    const userId = Accounts.createUser({
      username: userData.alias,
      email: userData.email,
      profile,
    });
    if ((await Meteor.users.find().countAsync()) === 1) {
      Accounts.setPassword(userId, 'blubs');
      Roles.addUsersToRoles(await Meteor.users.findOneAsync(userId), ['admin', 'club']);
    } else {
      console.log('Created user:', userId, userData.email);
      // send enrollment link to new user if a admin adds a new one
      if (settings().siteRegistration !== 'admin') {
        const token = await createEmailVerificationToken(userId, userData.email);
        console.log('Created token:', token);

        Mail.send(
          [userId],
          'E-Mail Verifizierung',
          'Bitte klicke den Link: ' + hostname() + '/#/enroll-account/' + token
        );
        console.log('Sent email');
      }
    }
  },
});

async function createEmailVerificationToken(userId, email) {
  const user = await Meteor.users.findOneAsync(userId);
  if (!user) {
    throw new Meteor.Error('auth-err', 'No user found');
  }

  if (!_.contains(_.pluck(user.emails || [], 'address'), email)) {
    throw new Meteor.Error('auth-err', 'No email found');
  }
  const tokenRecord = {
    token: Random.secret(),
    email,
    when: new Date(),
  };

  await Meteor.users.updateAsync(userId, {
    $set: {
      'services.password.reset': tokenRecord,
    },
  });
  return tokenRecord.token;
}
