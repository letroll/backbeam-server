var argmnts = require('./arguments')
var txain = require('txain')
var _ = require('underscore')

module.exports = function(core, req, res, private) {

  var backbeam = private.backbeam

  backbeam.sdk = function() {
    return private.sdk
  }

  backbeam.sendMail = function() {
    var args       = argmnts(arguments, false)
    var type       = args.next('type')
    var options    = args.nextObject('options') || {}
    var recipients = args.rest()

    txain(recipients)
    .each(function(recipient, callback) {
      if (recipient && _.isFunction(recipient.entity)) {
        options.user = recipient
      } else {
        options.to = recipient
      }
      core.email.sendMail(type, options, function(err) {
        if (err) {
          core.logs.error(err)
        }
        callback()
      })
    })
    .end(function() {

    })
  }

  /*
  backbeam.stat = function() {
    var args   = argmnts(arguments, false)
    var metric = args.next('metric', false)+''
    var user   = args.next('user', true) || currentUser

    try {
      core.stats.customFlag(false, user, metric, new Date())
    } catch(err) {
      core.logs.error(err)
    }
  }
  */

}
