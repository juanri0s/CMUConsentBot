const tmi = require('tmi.js')
const setting = require('./Settings/connectionSetting.json')
const opts = setting.opts

var consentList = require('fs').readFileSync("consentlist.txt", 'utf-8')
    .split('\n')
    .filter(Boolean);

class TwitchHandler {
  
  constructor () {

  }

  initialize(){

    // Create a client with our options:
    let client = new tmi.client(opts)

    // Register our event handlers (defined below):
    client.on('message', this.onMessage.bind(this))
    client.on('connected', this.onConnectedHandler.bind(this))
    client.on('disconnected', this.onDisconnectedHandler.bind(this))
    client.on('join', this.onJoinHandler.bind(this))

    // Connect to Twitch:
    client.connect()

    this.client = client
    
  }

  // // Helper to send the correct type of message:
  sendMessage (target, messageType, message) {
  
    if(target === ""){

      target = opts.channels[0]
    
    }
    
    if (messageType === 'whisper') {
      this.client.whisper(target, message)
    } else {
      this.client.say(target, message)
    }
  }

  onMessage (target, context, msg, self) {
  
    if (self) {return}

    let viewerUsername = context.username
    let msgType = context["message-type"]

    if (msgType === 'chat') {
      if (consentList.indexOf(viewerUsername) > -1) {
        console.log("user: " + viewerUsername +" has already consented!")
      } else {
        this.sendMessage(viewerUsername, 'whisper', "here is a consent form. Fill it out please. Say 'stop' if you no longer want to receive whispers. Feel free to ask for the link again with the command 'CMU' https://www.google.com" )
      }  
    } else if (msgType === 'whisper') {
      if (msg === 'stop') {
        console.log("user: " + viewerUsername +" does not want to consent. Ignore the user and stop sending the form.")
        // We somehow need to have it not send messages anymore to this user. But if they use a command, we send it to them. 
      }
    }
  }

  checkStreamIsOffLine () {
    this.client.api({
      url: setting.channelUrl, headers: setting.headers

    }, function (err, res, body) {
      console.log(body.stream)

      if (body.stream) {
        return
      }else {
        process.exit(1);
      }
    })
  }

  onJoinHandler (target, username, self) {

    if (self) {
      console.log("CMUConsentBot is ready!")
      this.sendMessage("", 'chat', "Hi I am CMUConsentBot. Here is a consent form. Fill it out please. https://www.google.com" )
    }

    console.log(username + ' enters the chat')
  }

  // Called every time the bot connects to Twitch chat:
  onConnectedHandler (addr, port) {

    console.log(`* Connected to ${addr}:${port}`)

  }

  // Called every time the bot disconnects from Twitch:
  onDisconnectedHandler (reason) {

    console.log(`Womp womp, disconnected: ${reason}`)
   
  }

}

module.exports = TwitchHandler
const twitchHandler = new TwitchHandler()
twitchHandler.initialize()

