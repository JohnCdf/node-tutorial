var enviorments = {};

enviorments.staging={
    'port':8080,
    'envName':'staging'
};

enviorments.production={
    'port':1337,
    'envName':'production'
}

var currentEnviorment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase():'';

var enviormentToExport = typeof(enviorments[currentEnviorment]) === 'object' ? enviorments[currentEnviorment] : {};

module.exports = enviormentToExport;