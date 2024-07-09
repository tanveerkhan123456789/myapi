const express = require('express')
const {Online_db_connection,local_db_connection} = require("./database/index");
const {PORT} = require("./config/index");
const port =PORT;
const bodyParser = require('body-parser');
// Online_db_connection();
local_db_connection();

const app = express();
// dbConnect();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({msg:'sssd s'})
  })

  // Create an item

  // Routes
  app.use('/api/item', require('./routes/item'));

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });