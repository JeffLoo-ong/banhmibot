require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser');
const { Wit, log } = require('node-wit');

// START Init

const app = express()
const port = 3000

// END Init

// START Middleware
// Support parsing of application/json type post data
app.use(bodyParser.json());

// Support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

// END Middleware

const client = new Wit({
  accessToken: process.env.WIT_TOKEN,
  logger: new log.Logger(log.DEBUG) // optional
});

app.post('/ask', (req, res) => {
  const sQuery = req.body.query;
  if(!sQuery || sQuery.length < 1){
    res.status(400).json({
      message:'I need more input to output, my dude/dudette.'
    })
  } else {
    client.message(sQuery , {})
      .then((data) => {
        let order = null, sandwiches = [], numSandwiches = 0, sentiment = 0;
        
        // Check Intent, ASSUMES intent exists
        order = checkIntent(data.entities.intent)
      
        // Check Sandwich Type, ASSUMES SANDWICH TYPE
        if(order && data.entities.sandwich_type){
          // Get the list of sammiches! 
          // TODO check confidence level
          sandwiches = data.entities.sandwich_type.map(sammich => sammich.value);
        } else if (!order || order == 'order_null'){ 
          returnMsg(res, 'I can\'t tell if you are trying to make an order...')
        } else {
          // Gimme a sandwich type bro!
          returnMsg(res, 'Um... what kind of sandwich?')
        }
        
        // Check Number
        if(data.entities.number){
          numSandwiches = data.entities.number.reduce((acc, curVal) => acc + curVal.value, 0)
          console.log(`Num sandwiches: ${numSandwiches}`);

          if(numSandwiches < 0){
            returnMsg(res, 'You gotta order more than 0 sandwiches, you robit.')
          } else {
            // Check Sentiment
            const levelOfChill = data.entities.sentiment[0].value;
            if(levelOfChill === "positive"){
              returnMsg(res, `You seem like a nice person.` + 
                `I think you want ${numSandwiches} sandwiches. your choices are ` +
                `${sandwiches.join(',')}`
              )
            } else if (levelOfChill === "negative"){
              returnMsg(res,
                `I think you want ${numSandwiches} sandwiches. your choices are ` +
                `${sandwiches.join(',')}... jerk.`
              )
            } else {
              returnMsg(res,
                `I think you want ${numSandwiches} sandwiches. your choices are ` +
                `${sandwiches.join(',')}.`
              )
            }
          }
        }
      })
      .catch(console.error);
  }
})

// Services
const returnMsg = (res, message) => {
  res.status(200).json({
    message
  })
  res.end();
}

const checkIntent = (intentArr) => {
  let changeMeLater = intentArr[0].value;
  // Default
  return changeMeLater;
}

const confidenceClassifier = (cScore) => {
  if(cScore < .50) {
    return -1;  // :(
  } else if (cScore < .80){
    return 0;   // :|
  } else {
    return 1;   // :)
  }
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))