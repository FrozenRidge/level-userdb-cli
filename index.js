#!/usr/bin/env node

var data = require('level-userdb')
var editor = require('editor')
var fs = require('fs')
var mktemp = require('mktemp')
var multilevel = require('multilevel')
var net = require('net')
var ui = require('optimist')
  .usage('Usage: $0 -d [database] -r [server:port] -e [email] -p [password] <COMMAND>')
  .alias('d', 'database')
  .describe('d', 'Path to database location')
  .alias('e', 'email')
  .describe('e', 'email address')
  .alias('n', 'new-email')
  .describe('n', 'new email address')
  .alias('p', 'password')
  .describe('p', 'password')
  .alias('r', 'remote')


var oh = ui.help()
ui.help = help

var commands = {
  create: {desc:"Create a new user with email & password"},
  delete: {desc:"Delete a user by email"},
  edit: {desc:"Edit a user's data field with $EDITOR"},
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

if (!argv.r && !argv.d) {
  console.log('Error: You must specify a database via -d (filesystem) or -r (remote)')
  ui.showHelp()
  process.exit(1)
}

if (argv.r && argv.d) {
  console.log('Error: You cannot specify BOTH a database via -d (filesystem) and -r (remote)')
  ui.showHelp()
  process.exit(1)
}


if (argv._.length < 1) bail()

argv._.forEach(function(cmd) {
  if (Object.keys(commands).indexOf(cmd) === -1) {
    bail()
  }
  if (argv.database) {
    handleCmd(cmd, data(argv.database), function() {})
  }
  if (argv.remote) {
    var host = argv.remote.split(':')[0]
    var port = 9998
    try {
      port = parseInt(argv.remote.split(':')[1])
    } catch(e) {
    }
    console.log("connecting to %s:%d", host, port)
    var db = multilevel.client()
    db.pipe(net.connect({port:port, host:host})).pipe(db)
    console.log("connected to %s:%d", host, port)
    handleCmd(cmd, data(db), function() {
      process.exit(0)
    })

  }
})

function handleCmd(cmd, db, cb) {
  if (cmd === 'create') {
    console.log("Creating user")
    db.addUser(argv.email, argv.password, function(err) {
      if (err) throw err
      console.log("ok")
      cb(null)
    })
  } else if (cmd === 'retrieve') {
    db.findUser(argv.email, function(err, userObj) {
      if (err) {
        console.log("Error: %s not found", argv.email)
        process.exit(1)
      }
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Created:\t %s", userObj.createdDate)
      console.log("Modified:\t %s", userObj.modifiedDate)
      console.log("Password hash:\t %s", userObj.password)
      console.log("Arbitrary data:\t %s", JSON.stringify(userObj.data, null, '\t'))
      cb(null)
    })
  } else if (cmd === 'verify') {
    db.checkPassword(argv.email, argv.password, function(err, res) {
      console.log("User email: %s", argv.email)
      console.log("==============================")
      if (err) {
        console.log("Bad password: %s", err)
        process.exit(1)
      }
      console.log("Good password")
      cb(null)
    })
  } else if (cmd === 'delete') {
    db.deleteUser(argv.email, function(err, res) {
      if (err) throw err
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Deleted.")
      cb(null)
    })
  } else if (cmd === 'password') {
    db.changePassword(argv.email, argv.p, function(err, res) {
      console.log("User email: %s", argv.email)
      console.log("==============================")
      console.log("Password updated")
      cb(null)
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
      cb(null)
    })
  } else if (cmd === 'list') {
    console.log("==========================================================================================")
    console.log("Email \t\t\t Created At \t\t\t Modified At")
    console.log("==========================================================================================")
    db.createUserStream()
      .on('data', function(user) {
          process.stdout.write(user.email + "\t\t")
          process.stdout.write(user.createdDate + "\t")
          process.stdout.write(user.modifiedDate + "\n")
      })
      .on('end', function() { cb(null) })
  } else if (cmd === 'edit') {
    var path
    var user

    function find() {
      db.findUser(argv.email, mktempFile)
    }

    function mktempFile(err, u) {
      if (err) {
        console.log("Error: %s not found, exiting", argv.email)
        process.exit(1)
      }
      user = u
      mktemp.createFile('dbajs-XXXXXX', writeFile)
    }

    function writeFile(err, p) {
      if (err) throw err
      path = p
      fs.writeFile(path, JSON.stringify(user.data, null, '\t'), editFile)
    }

    function editFile(err) {
      if (err) throw err
      editor(path, readEditedFile)
    }

    function readEditedFile(code, sig) {
      fs.readFile(path, modifyUser)
    }

    function modifyUser(err, data) {
      if (err) throw err

      var d
      try {
        d= JSON.parse(data)
      } catch(e) {
        console.log("invalid JSON, cannot modify")
        process.exit(1)
      }
      db.modifyUser(argv.email, d, cleanup)
    }

    function cleanup(err) {
      fs.unlink(path, function() {})
      console.log("ok")
      cb(null)
    }

    find()

  }
}
