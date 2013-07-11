#!/usr/bin/env node

var data = require('level-userdb')
var editor = require('editor')
var fs = require('fs')
var mktemp = require('mktemp')
var ui = require('optimist')
  .usage('Usage: $0 -d [database] -e [email] -p [password] <COMMAND>')
  .alias('d', 'database')
  .describe('d', 'Path to database location')
  .alias('e', 'email')
  .describe('e', 'email address')
  .alias('n', 'new-email')
  .describe('n', 'new email address')
  .alias('p', 'password')
  .describe('p', 'password')

var oh = ui.help()
ui.help = help

var commands = {
  create: {desc:"Create a new user with email & password"},
  delete: {desc:"Delete a user by email"},
  edit: {desc:"Edit a user's data with $EDITOR"},
  email: {desc:"Update a user's email address"},
  list: {desc:"List all users"},
  password: {desc:"Update a user's password by email"},
  retrieve: {desc:"Fetch an existing user by email"},
  verify: {desc:"Check password"},
}

function help() {
  var msg = ""
  Object.keys(commands).forEach(function(k) {
    var cmd = k
    var desc = commands[cmd].desc
    if (cmd.length < 6) cmd += "\t"
    msg += "  " + cmd + "\t " + desc + "\n"
  })
  var h = oh + "\n" +
    "Commands:\n" +
    msg
  return h

}

var argv = ui.argv

function bail() {
  console.error("Error: You must specify a command\n")
  ui.showHelp()
  process.exit(1)
}

if (argv._.length < 1) bail()

argv._.forEach(function(cmd) {
  if (Object.keys(commands).indexOf(cmd) === -1) {
    bail()
  }
  var db = data(argv.database)
  if (cmd === 'create') {
    console.log("Creating user")
    db.addUser(argv.email, argv.password, function(err) {
      if (err) throw err
      console.log("ok")
    })
  } else if (cmd === 'retrieve') {
    db.findUser(argv.email, function(err, userObj) {
      if (err) throw err
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Created:\t %s", userObj.createdTimestamp)
      console.log("Modified:\t %s", userObj.modifiedTimestamp)
      console.log("Password hash:\t %s", userObj.password)
      console.log("Arbitrary data:\t %s", JSON.stringify(userObj.data, null, '\t'))
    })
  } else if (cmd === 'verify') {
    db.checkPassword(argv.email, argv.password, function(err, res) {
      console.log("User email: %s", argv.email)
      console.log("==============================")
      if (err) {
        console.log("Bad password")
        process.exit(1)

      }
      console.log("Good password")
    })
  } else if (cmd === 'delete') {
    db.deleteUser(argv.email, function(err, res) {
      if (err) throw err
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Deleted.")
    })
  } else if (cmd === 'email') {
    if (!argv.n) {
      console.log("you must supply a new email address with `-n <email>`")
      process.exit(1)
    }
    db.changeEmail(argv.email, argv.n, function(err, res) {
      if (err) throw err
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Email updated to: %s", argv.n)
    })
  } else if (cmd === 'list') {
    db.printAllUsers()
  } else if (cmd === 'edit') {
    db.findUser(argv.email, function(err, user) {
      mktemp.createFile('dbajs-XXXXXX', function(err, path) {
        if (err) throw err
          fs.writeFile(path, JSON.stringify(user.data, null, '\t'), function(err) {
            if (err) throw err
            editor(path, function(code, sig) {
              fs.readFile(path, function(err, data) {
                if (err) throw err
                db.modifyUser(argv.email, JSON.parse(data), function(err) {
                  fs.unlink(path, function() {})
                  console.log("ok")
                })
              })
            })
        })
      })
    })
  }
})

