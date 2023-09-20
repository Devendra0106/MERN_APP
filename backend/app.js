const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HTTPError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

//To block CORS Policy
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', placesRoutes);   // => /api/places...
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    const error = new HTTPError('Could not find this route :(', 404);
    throw(error);
});

//this function executes when any middleware produces an error(when 4 args available then express.js considers first one as error)
app.use((error, req, res, next) => {
    if(res.headerSent){     //response and headers attached to it already sent
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || "An Unknown Error occured!"});
});


mongoose
    .connect('mongodb+srv://deven:password_01@cluster0.rpzolm4.mongodb.net/mern?retryWrites=true&w=majority')
    .then(() => {
        console.log('Connected to database!');
        app.listen(5000, () => {
            console.log('Listening to port 5000!');
        });
    })
    .catch((err) => {
        console.log(err)
    })
