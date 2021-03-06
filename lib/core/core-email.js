var txain = require('txain')
var nodemailer = require('nodemailer')
var path = require('path')
var errors = require('node-errors')
var nook = errors.nook
var nunjucks = require('nunjucks')
var juice = require('juice')

module.exports = function(options) {

  var service = options.transport.service
  var transport
  if (service === 'stub') {
    transport = nodemailer.createTransport(require('nodemailer-stub-transport')())
  } else {
    transport = nodemailer.createTransport(options.transport)
  }

  return function(core) {

    var email = {}

    email.sendMail = function(type, templateOptions, callback) {
      var extensions = ['subject']
      if (options.format === 'text') {
        extensions.push('txt')
      } else if (options.format === 'html') {
        extensions.push('html')
      } else {
        extensions.push('txt')
        extensions.push('html')
      }

      templateOptions.host = 'localhost' // TODO

      var contents = {}
      var dir = path.join('email_templates', type)
      var files = extensions.map(function(extension) {
        return path.join(dir, type+'.'+extension)
      })
      txain(files)
        .map(function(file, callback) {
          core.fs.readFileAsString(file, callback)
        })
        .each(function(content, callback) {
          try {
            var output = new nunjucks.Template(content, null, 'template').render(templateOptions)
            var extension = extensions.shift()
            if (extension === 'html' && options.inline) {
              var inlineOptions = {
                applyLinkTags: false,
                removeLinkTags: false,
                applyStyleTags: true,
                removeStyleTags: true,
                url: 'http://localhost/',
              }
              juice.juiceContent(output, inlineOptions, nook(callback,
                function(html) {
                  contents[extension] = html
                  return callback(null)
                })
              )
            } else {
              contents[extension] = output
              return callback(null)
            }
          } catch (err) {
            return callback(err)
          }
        })
        .then(function(callback) {
          var to = templateOptions.to
          if (!to && templateOptions.user && typeof templateOptions.user.get === 'function') {
            to = templateOptions.user.get('email')
          }
          transport.sendMail({
            from: options.from,
            to: to,
            subject: contents['subject'],
            text: contents['txt'],
            html: contents['html'],
          }, callback)
        })
        .end(callback)
    }

    return email
  }

}
