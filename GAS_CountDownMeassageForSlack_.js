function myFunction() {
  //convert to date by Moment.js
  var hackdate = Moment.moment('XXXXXXX');
  var now = Moment.moment();
  
  //Messeage to Slack
  var message = '';
  message += '@channel \n';
  message += 'XXXXXXまで'+ -now.diff(hackdate, 'days') + '日です！\n';
  
  //Please get your posting key from Slack
  postSlack('XXXXXXX', 'countdown', 'countdown-bot', message);
}

function postSlack(token, channel, username, text) {
  var url = 'https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + channel + '&username=' + username + '&text=' + encodeURIComponent(text);
  response = UrlFetchApp.fetch(url).getContentText("UTF-8");
}