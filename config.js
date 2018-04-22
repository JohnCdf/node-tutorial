var enviorments = {};

enviorments.staging={
    'httpPort':3000,
    'httpsPort':3001,
    'envName':'staging',
    'hashingSecret':'mySecret'
};

enviorments.production={
    'httpPort':5000,
    'httpsPort':5001,
    'envName':'production',
    'hashingSecret':'mySecret'
}

var currentEnviorment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase():'staging';

var enviormentToExport = typeof(enviorments[currentEnviorment]) === 'object' ? enviorments[currentEnviorment] : {};

module.exports = enviormentToExport;