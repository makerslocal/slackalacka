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

///////////////
// Variables //
///////////////
var users = [];
var channels = [];

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

function update_slack_users() {
    slack_bot.getUsers(). then(
        function(data) { // on fufill
            console.log("get users: fufilled");
    	       console.log(util.inspect(data));
               var members = data.members;
               users = []; // reset users
               for (var i = 0; i < members.length; i++) {
                   users.push({
                       'id': members[i].id,
                       'name': members[i].name
                   });
               }
               console.log("Done updating slack users: ");
               console.log(util.inspect(users));
        },
        function() { // on reject
            console.log("get users: rejected");
    	       //console.log(util.inspect(reject));
        },
        function() { // on notified
            console.log("get users: notified");
    	       //console.log(util.inspect(note));
        }
    );
}

function update_slack_channels() {
    slack_bot.getChannels(). then(
        function(data) { // on fufill
            console.log("get channels: fufilled");
	       console.log(util.inspect(data));
           var chans = data.channels;
           channels = []; // reset users
           for (var i = 0; i < chans.length; i++) {
               channels.push({
                   'id': chans[i].id,
                   'name': chans[i].name
               });
           }
           console.log("Done updating slack channels: ");
           console.log(util.inspect(channels));
        },
        function() { // on reject
            console.log("get channels: rejected");
    	       //console.log(util.inspect(reject));
        },
        function() { // on notified
            console.log("get channels: notified");
    	       //console.log(util.inspect(note));
        }
    );
}

function get_user(id) {
    for (var i = 0; i < users.length; i++) {
        if (id === users[i].id) {
            return(users[i].name);
        }
    }
    update_slack_users();
    return(get_user(id));
}

function get_channel(id) {
    for (var i = 0; i < channels.length; i++) {
        if (id === channels[i].id) {
            return(channels[i].name);
        }
    }
    update_slack_channels();
    return(get_channel(id));
}

slack_bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services
    slack_bot.postMessageToChannel('irc_gen', 'IRC link starting...');
    slack_bot.postMessageToChannel('irc_makerslocal', 'IRC link starting...');

    update_slack_users();
    update_slack_channels();

    // define existing username instead of 'user_name'
    //bot.postMessageToUser('user_name', 'hi!', params);

    // define private group instead of 'private_group', where bot exist
    //bot.postMessageToGroup('private_group', 'hi!', params);
});

slack_bot.on('message', function(data) {
    if (data.type !== 'message' || typeof(data.user) === 'undefined') {
        console.log("Dropping event that isn't message.");
        return;
    }
    var text = data.text;
    var name = "NA";
    var channel = "NA";
    name = get_user(data.user);
    channel = get_channel(data.channel);
    console.log("From slack: " + channel + ": [" + name + "] " + text);
	//console.log(util.inspect(data));

    var irc_text = '[' + name + '] ' + text;
    if (channel === 'irc_gen') {
        irc_bot.say('##gen', irc_text);
    } else if (channel === 'irc_makerslocal') {
        irc_bot.say('#makerslocal', irc_text);
    }
});

//client.join('#makerslocal');
//client.say('#makerslocal', "I might be a bot. Only tylercrumpton knows.");

// Plug and play, baby.
