require('dotenv').config();

const mongoose = require('mongoose');

console.log(process.env.DATABASE_URL)
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})

const db = mongoose.connection
db.on('error', error => console.error())
db.once('open', () => console.log('Connected to DB'))

module.exports = db