import http from 'http';
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser';

import api from './api'
import crons from './crons'

let app = express()
app.server = http.createServer(app);

app.use(morgan('dev'))
app.use(bodyParser.json())

app.use('/', api);

crons()

app.server.listen(process.env.PORT || 8000, () => {
  // eslint-disable-next-line no-console
  console.log(`Running on: http://localhost:${app.server.address().port}`);
});

export default app