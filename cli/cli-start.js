var fs = require('fs')
var path = require('path')
var colors = require('colors')
var program = require('commander')
var version = require('../package.json').version
var express = require('express')
var backbeam = require('../')
var txain = require('txain')
var http = require('http')

program
  .version(version)
  .option('-d, --directory [<s>]', 'Directory where the project have to be created', process.cwd())
  .option('-p, --port [<d>]', 'Server port', 3000)
  .parse(process.argv)

console.log('Starting project with base directory: %s', program.directory)

var server
var app = express()

txain(function(callback) {
  try {
    fs.readFile(path.join(program.directory, 'config.json'), 'utf8', callback)
  } catch(err) {
    return callback(err)
  }
})
.then(function(conf, callback) {
  try {
    var config = JSON.parse(conf)
  } catch(err) {
    return callback(err)
  }

  config.fs = {
    manager: 'local',
    root: program.directory
  }
  
  var server = backbeam.createServer(config)

  app.use(require('body-parser').urlencoded({ extended: true }))

  app.use(require('cookie-parser')('secret'))

  app.use('/admin', server.adminResources())

  app.use('/api', server.apiResources())

  app.use(server.webResources())

  http.createServer(app).listen(program.port)

  console.log('Started server at port %d', program.port)

  callback()
})
.end(function(err) {
  if (err) {
    console.log('Error', err.stack.red)
  }
})