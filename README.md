level-userdb-cli
================

CLI interface to databases produced by [level-userdb](http://github.com/FrozenRidge/level-userdb).


## Installation

`npm install -g level-userdb-cli`

#### Adding a user

`level-userdb-cli -e foo@example.com -p supersecret create`

#### List all users

`level-userdb-cli list`

#### Modifying a user's data

`level-userdb-cli -e foo@example.com modify`

This will start $EDITOR so you can edit the JSON in your favourite editor. When you exit the new data
will be saved.

#### Checking a password 

`level-userdb-cli -e foo@example.com -p wrongpassword verify`

#### Retrieve a user record

`level-userdb-cli -e foo@example.com retrieve`

#### Delete a user record

`level-userdb-cli -e foo@example.com delete`

#### Change a user's password

`level-userdb-cli -e foo@example.com -p newPassword`

#### Change a user's email address

`level-userdb-cli -e foo@example.com -n newfoo@example.com`


