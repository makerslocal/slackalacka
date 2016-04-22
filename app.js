/**
 * Slackalacka
 *
 * An IRC bot that relays traffic to a slack team,
 *
 * Christopher 'ctag' Bero - bigbero@gmail.com
 */

/////////////
// modules //
/////////////
var path = require('path');
var util = require('util');
var os = require('os');
var exec = require('child_process').exec;
var numCores = os.cpus().length;
var secrets = require('./secrets.json');
var irc = require('irc');
var slackbots = require('slackbots');

////////////
// config //
////////////
var irc_bot = new irc.Client(secrets.irc.server, secrets.irc.botName, {
    userName: secrets.irc.botUser,
    realName: secrets.irc.botReal,
    debug: true,
    showErrors: true,
    channels: ['#makerslocal', '##gen'],
});
var slack_bot = new slackbots({
    token: secrets.slack.token, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: secrets.slack.botName
});

irc_bot.addListener('message#', function (from, to, text, message) {
    console.log(from + ' => ' + to + ': ' + message + ' [' + text + ']');
    var slack_text = '[' + from + '] ' + text;
    if (to === '##gen') {
        slack_bot.postMessageToChannel('irc_gen', slack_text);
    } else if (to === '#makerslocal') {
        slack_bot.postMessageToChannel('irc_makerslocal', slack_text);
    }
});

irc_bot.addListener('error', function(message) {
    console.log('error: ', message);
});

irc_bot.addListener('registered', function(message) {
    console.log('identifying with nickserv');
    var ident_msg = 'IDENTIFY ' + secrets.irc.identPassword;
    irc_bot.say('NickServ', ident_msg);
});

slack_bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services
    slack_bot.postMessageToChannel('irc_gen', 'IRC link starting...');
    slack_bot.postMessageToChannel('irc_makerslocal', 'IRC link starting...');

    // define existing username instead of 'user_name'
    //bot.postMessageToUser('user_name', 'hi!', params);

    // define private group instead of 'private_group', where bot exist
    //bot.postMessageToGroup('private_group', 'hi!', params);
});

slack_bot.on('message', function(data) {
    console.log(data);
    var irc_text = '[' + data.user + '] ' + data.text;
    if (data.channel === 'irc_gen') {
        irc_bot.say('##gen', irc_text);
    } else if (data.channel === 'irc_makerslocal') {
        irc_bot.say('#makerslocal', irc_text);
    }
});

//client.join('#makerslocal');
//client.say('#makerslocal', "I might be a bot. Only tylercrumpton knows.");

// Plug and play, baby.
