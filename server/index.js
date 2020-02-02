const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const redis = require('redis')
const { Pool } = require('pg')
const keys = require('./keys')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hi')
})

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values')
  res.send(values.rows)
})

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    console.log('values', values)
    res.send(values)
  })
})

app.post('/values', async (req, res) => {
  const { index } = req.body
  if (parseInt(index) > 40) {
    return res.status(422).send('Index is too high')
  }

  redisClient.hset('values', index, 'Nothing yet!')
  redisPublisher.publish('insert', index)
  console.log('Got index', index)

  pgClient.query('INSERT INTO values(number) VALUES ($1)', [index])
  res.send({ working: true })
})

app.listen(5000, () => {
  console.log('Listening on 5000')
})

const pgClient = new Pool({
  user: keys.pgHost,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
})

pgClient.on('error', () => {
  console.log('Lost Postgress connection')
})

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err))

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
})
const redisPublisher = redisClient.duplicate()
