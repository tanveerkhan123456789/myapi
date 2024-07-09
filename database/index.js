const mongoose = require('mongoose');
const { MONGODB_CONNECTION_STRING } = require('../config/index');

// Function to connect to the online database
const Online_db_connection = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log(`Online database connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error connecting to online database: ${error}`);
  }
}

// Function to connect to the local database
const local_db_connection = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017');
    console.log(`Local database connected to host: ${conn.connection.host}`);
  } catch (err) {
    console.error('Error connecting to local MongoDB', err);
  }
}

module.exports = {
  Online_db_connection,
  local_db_connection,
};
