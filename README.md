
# This repo has moved to Codeberg [https://codeberg.org/larswolter/ultisite](https://codeberg.org/larswolter/ultisite)  

# Ultisite

Team Management Website for Ultimate Frisbee Teams

## Features

Manage Teams for Tournaments
- Manage Tournaments
- Add multiple Teams for the tournaments, distinguish between club teams and project teams
- Allow the users to sign in to the teams, give comments change their state
- Allow drawing of the final roster if to many players are entered
- Record Team infos after the tournament, placements, pictures, text reports

Practices
- list practices with all necessary information
- including small map image

Wikipages
- Editable pages using a wysiwyg editor
- Discussions for each page
- Pages are used to be shown on startpage, impressum, practices or directly accessible in the menus

File Management
- upload files, structure them in folders, have files associated with tournaments or Wikipages

User Management
- Allow self registration using global password or confirmation thru admin
- different user roles like admin and club manager (manages registration state for DFV for example)
- User photo, contact information player statistics

Activitylog
- display last events on the start page
- send daily digest mails or immediate info mails (configurable per user)

## Setup

- Install meteor [https://www.meteor.com](https://www.meteor.com)
- clone Repository 
- Run `meteor npm install` in the main directory
- Run `meteor` in the main directory
- The site is then available under [http://localhost:3000](http://localhost:3000)
- On the first access you will need to create the Admin user that can configure the rest of the site. Choose Anmelden-> Registrieren to create the first user

