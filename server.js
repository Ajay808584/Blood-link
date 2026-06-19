const express = require('express');
const cors = require('cors');
const db = require('./db');

const userRoutes = require('./tempfolder/users');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('BloodLink Server Running');
});

app.listen(5000, () => {
    console.log('Server Started on Port 5000');
});