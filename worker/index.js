const { redisHost, redisPort } = require('./keys')
const redis = require('redis')

const redisClient = redis.createClient({
  host: redisHost,
  port: redisPort,
  retry_strategy: () => 1000
})
const sub = redisClient.duplicate()

function fib (index) {
  return index > 1 ? fib(index - 1) + fib(index - 2) : 1
}

sub.on('message', (channel, message) => {
  redisClient.hset('values', message, fib(parseInt(message)))
})

sub.subscribe('insert')
