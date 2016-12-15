var moment = require("moment");


//var casper = require('casper').create();
casper.test.begin("logout/login", 3, function suite(test) {
    casper.start('http://hallunken.larswolter.de.local:3000/', function() {
        this.echo(this.getTitle());
        this.viewport(1280, 3000);
        this.waitUntilVisible('nav', function() {
            this.capture("initial-page.png");
            if (this.visible('#dropdownUserMenu')) {
                this.click('#dropdownUserMenu');
                this.waitUntilVisible('.action-logout', function() {
                    this.click('.action-logout');
                });
            }
            this.waitUntilVisible('.btn-login-link', function() {
                test.assertVisible('.btn-login-link', "Login button da");
            });
        });
    });

    casper.then(function() {
        this.click('.btn-login-link');
    });

    casper.then(function() {
        this.waitUntilVisible('#loginEmail', function() {
            test.assertVisible('input#loginEmail', "Login fields da");
            this.fillSelectors("form#loginDialogForm", {
                'input#loginEmail': "lars@larswolter.de",
                'input#loginPassword': "blubs",
            });
        });
    });
    casper.then(function() {
        this.click('#loginButton');
        this.waitWhileVisible('#loginEmail', function() {
            this.capture("loggedin.png");
            test.assertVisible('#dropdownUserMenu', "Logged in");
            test.done();
        });
    });
    casper.run();
});

casper.test.begin("wikipage handling", 4, function suite(test) {
    casper.then(function() {
        this.click('li.dropdown > a');
        this.waitUntilVisible('a[href="/wikipage"]', function() {
            this.click('a[href="/wikipage"]');
            this.waitUntilVisible('#new-wikipage', function() {
                test.assertTextExists('Alle Wikiseiten', "switching to wiki pages");
            });
        });
    });
    casper.then(function() {
        this.fillSelectors('#new-wikipage', {
            "input.wiki-page-name": "Caspers Seite"
        }, false);
        this.click(".action-create-page");
        this.waitUntilVisible('div[title="Caspers Seite"]', function() {
            this.click('div[title="Caspers Seite"] > a');
            this.waitUntilVisible('.editing-container', function() {

                test.assertVisible('.editing-container', "created wikipage");
                this.mouse.doubleclick('.editing-container');
                this.waitUntilVisible('.wysiwyg-editor', function() {
                    this.click('a[title="Bold (Ctrl+B)"]');
                    this.sendKeys(".wysiwyg-editor", "Caspers Wikiseite");
                    this.click('a[title="Bold (Ctrl+B)"]');
                    this.sendKeys(".wysiwyg-editor", "\n\nHier ist meine Testseite");
                    this.click('a[title="Save (Ctrl+S)"]');
                    this.waitUntilVisible('.editing-mark', function() {
                        test.assertTextExists('Caspers Wikiseite', "entered wikipage content");
                        this.capture("wikiseite.png");
                    });
                });
            });
        });
    });
    casper.then(function() {
        this.click('li.dropdown > a');
        this.waitUntilVisible('a[href="/wikipage"]', function() {
            this.click('a[href="/wikipage"]');
            this.waitUntilVisible('#new-wikipage', function() {
                test.assertTextExists('Alle Wikiseiten', "switching to wiki pages");
            });
        });
        if (this.visible('div[title="Caspers Seite"]'))
            this.click('div[title="Caspers Seite"] > .action-remove-page');
        else
            this.waitUntilVisible('div[title="Caspers Seite"]', function() {
                this.click('div[title="Caspers Seite"] > .action-remove-page');
            });
    });
    casper.then(function() {
        test.done();
    });
    casper.run();
});

casper.test.begin("userpage handling", 1, function suite(test) {
    casper.then(function() {
        this.click('#dropdownUserMenu');
        this.waitUntilVisible('.goto-user-profile', function() {
            this.click('.goto-user-profile');
            this.waitUntilVisible('.list-group.user-base', function() {
                test.assertVisible('.list-group.user-base', "On user page");
            });
        });
    });
    casper.then(function() {
        test.done();
    });
    casper.run();
});

casper.test.begin("tournament handling", 7, function suite(test) {

    casper.then(function() {
        this.click('a[href="/tournaments"]');
        this.waitUntilVisible('button[data-target="#tournamentCreateDialog"]', function() {
            this.click('button[data-target="#tournamentCreateDialog"]');
            this.waitUntilVisible('form#tournamentCreateForm', function() {
                test.assertVisible('form#tournamentCreateForm', "Create Tournament Dialog Open");
                this.click('input[name="date"]');
                this.sendKeys('input[name="date"]',moment().add(5,"days").format("DD.MM.YYYY"));
                this.fill('#tournamentCreateForm', {
                    name: "Casper JS Turnier",
                    'address.city': 'Teststadt',
                    'divisions.0.division': 'Mixed',
                    'divisions.0.surface': 'Sand',
                    'divisions.0.numPlayers': 7,
                    'divisions.0.name': 'MixedPool'
                }, true);
                this.capture("filledTournament.png");
            });
        });
    });
    casper.then(function() {
        this.waitUntilVisible('.tournament-heading', function() {
            test.assertTextExists("Casper JS Turnier", "Tournament created");
            this.click('.btn-add-infos');
            this.waitUntilVisible('.wysiwyg-editor', function() {
                this.sendKeys(".wysiwyg-editor", "Turnierinfos von Casper");
                this.click('a[title="Save (Ctrl+S)"]');
            });
        });
    });
    casper.then(function() {
        this.click('button[data-target="#teamUpdateDialog"]');
        this.waitUntilVisible('form#teamUpdateForm', function() {
            test.assertVisible('form#teamUpdateForm', "Create Team Dialog Open");
            this.fill('#teamUpdateForm', {
                name: "Caspers Team",
                'state': 'confirmed'
            }, true);
            this.capture("filledTeam.png");
            this.waitWhileVisible('.modal-backdrop', function() {});
        });
    });
    casper.then(function() {
        this.click('.btn-warning.action-insert');
        this.click('.action-switch-invite');
        this.waitUntilVisible('.alias-field', function() {
            this.sendKeys(".alias-field", "dani");
            this.waitUntilVisible('.dropdown.open li > a', function() {
                this.click('.dropdown.open li > a');
                this.waitWhileVisible('.dropdown.open li > a', function() {
                    this.click('.btn-success.action-insert');
                    this.waitUntilVisible('.btn-state-change.btn-success', function() {
                        test.assertVisible('.btn-state-change.btn-success', "Insert other");
                        this.click('button[data-target="#turnierBody"]');
                    });
                });
            });
        });
    });
    casper.then(function() {
        this.capture("finishedTournament.png");
        test.assertTextExists('Turnierinfos von Casper', "Edit Tournament settings");
        this.click('.btn-remove-part');
        this.waitUntilVisible('.notifyjs-ultisite-success', function() {
            this.click('.btn-remove-part');
            this.waitUntilVisible('.team-remove', function() {
                this.click('.team-remove');
                this.waitUntilVisible('.tournament-remove', function() {
                    this.click('.tournament-remove');
                    this.waitForText('Unsere geplanten Turniere', function() {
                        this.wait(1000, function() {
                            this.capture("finishedTournamentList.png");
                            test.assertTextDoesntExist('Casper JS Turnier', "Turnier gelöscht");
                            test.done();
                        });
                    });
                });
            });
        });
    });

    casper.run();
});
