level-userdb-cli
================

CLI interface to databases produced by [level-userdb](http://github.com/FrozenRidge/level-userdb).

This tool can either work against on-disk level-userdb databases, or over the network to a standalone [level-userdb-server](https://github.com/FrozenRidge/level-userdb-server) instance.

LeveDB databases can only be locked by a single process at a time, so level-userdb-server effectively allows administration of a live database.


## Installation

`npm install -g level-userdb-cli`

## Usage

```
Usage: level-userdb-cli -d [database] -r [server:port] -e [email] -p [password] <COMMAND>

Options:
  -d, --database   Path to database location
  -e, --email      email address
  -n, --new-email  new email address
  -p, --password   password

Commands:
  create	 Create a new user with email & password
  delete	 Delete a user by email
  edit		 Edit a user's data field with $EDITOR
  email		 Update a user's email address
  list		 List all users
  password	 Update a user's password by email
  retrieve	 Fetch an existing user by email
  verify	 Check password
```

## Local, On-Disk Usage

To operate against a local, on-disk level-userdb database supply the `-d [path to database]` flag. Note that only a single application can access a LevelDB database at a time, so this must be offline. To access an online database, consider using [level-userdb-server](https://github.com/FrozenRidge/level-userdb-server).

## Remote Network Usage

To connect to a remote level-userdb-server instance, supply the `-r host:port` flag. For example:

`level-userdb-cli -r localhost:9998 -e test@example.com retrieve`


## Supported Operations

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


