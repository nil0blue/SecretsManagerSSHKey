// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
var Client = require('ssh2').Client;
var SSH_USER_ID = "ubuntu";
var accessKey = "";
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
async function getAccessKey() {
  // Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/
return new Promise((resolve) => {
// Load the AWS SDK
var AWS = require('aws-sdk'),
region = "us-east-1",
secretName = process.env.SSHKeySecretName,
secret,
decodedBinarySecret;


// Create a Secrets Manager client
var client = new AWS.SecretsManager({
region: region
});

// In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
// See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// We rethrow the exception by default.

  client.getSecretValue({ SecretId: secretName }, function (err, data) {
    if (err) {
      console.log("err" + err);
      if (err.code === 'DecryptionFailureException')
        // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
        // Deal with the exception here, and/or rethrow at your discretion.
        console.log(err);

      //throw err;
      else if (err.code === 'InternalServiceErrorException')
        // An error occurred on the server side.
        // Deal with the exception here, and/or rethrow at your discretion.
        console.log(err);

      //throw err;
      else if (err.code === 'InvalidParameterException')
        // You provided an invalid value for a parameter.
        // Deal with the exception here, and/or rethrow at your discretion.
        console.log(err);

      //throw err;
      else if (err.code === 'InvalidRequestException')
        // You provided a parameter value that is not valid for the current state of the resource.
        // Deal with the exception here, and/or rethrow at your discretion.
        console.log(err);

      //throw err;
      else if (err.code === 'ResourceNotFoundException')
        // We can't find the resource that you asked for.
        // Deal with the exception here, and/or rethrow at your discretion.
        console.log(err);
      //throw err;
    }
    else {
      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      
      if ('SecretString' in data) {
        
        secret = data.SecretString;
        accessKey = secret;
        resolve(secret);
        
        
      } else {
        let buff = new Buffer(data.SecretBinary, 'base64');
        decodedBinarySecret = buff.toString('ascii');
        accessKey = decodedBinarySecret;
        resolve(decodedBinarySecret);
      }
    }


  });
  });
}


function sleep(secondstime) {
  return new Promise((resolve) => {
    
    setTimeout(resolve, secondstime * 1000);
  });
}


async function connectAndRunCommand(InstanceIp, command) {
  return new Promise((resolve) => {
    var conn = new Client();

    console.log('Connecting to ' + InstanceIp);
    console.log('Command ' + command);
    conn
      .on('error', function (err) {
        console.log('ERROR:' + err);
      }
      )
      .on('close', function () {
        //console.log(' closed');
        resolve("done!");
      }
      )
      .on('end', function () {
        //console.log(' ended');
      }
      )
      .on('ready', function () {
        conn.exec(command, function (err, stream) {
          if (err) throw err;
          stream.on('close', function (code, signal) {
            //console.log('Stream Closed');
            conn.end();
          }).on('data', function (data) {
            console.log('[INFO]: ' + data);
          }).stderr.on('data', function (data) {
            console.log('[ERROR]: ' + data);
          });
        });
      })
      .connect({
        host: InstanceIp,
        port: 22,
        username: SSH_USER_ID,
        //privateKey: require('fs').readFileSync('./CallAlertKeyPair.pem')
        privateKey: accessKey
      });
  });
}




exports.lambdaHandler = async (event, context) => {
  try {
    // const ret = await axios(url);
    const keyProm = await getAccessKey();

    var ConnectToIp = process.env.ConnectToIp;
    try {
      var Command = "ls -l";
      const resProm = await connectAndRunCommand(ConnectToIp, Command);
    } catch (ex) {
      console.log('Exception' + ex);
    }
    
    
  } catch (err) {
    console.log('error!' + err);
    response = {
      'statusCode': 200,
      'body': JSON.stringify({
        message: 'error',
        // location: ret.data.trim()
      })
    }
    return response;
  }
  
};
