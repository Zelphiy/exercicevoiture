const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
const secret_key = process.env.SECRET_JWT;

app.use(express.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
}));

const users = [
    { id: 1, username: 'user1', password: 'password1' },
    { id: 2, username: 'user2', password: 'password2' },
];

const voitures = [
    { marque: "Toyota", modele: "Corolla", annee: 2020 },
    { marque: "Honda", modele: "Civic", annee: 2019 },
    { marque: "Ford", modele: "Mustang", annee: 2021 },
    { marque: "BMW", modele: "X5", annee: 2018 },
    { marque: "Mercedes-Benz", modele: "C-Class", annee: 2022 }
];

const expiresIn = '1h';

app.post('/loginjwt', (request, response) => {
    const { username, password } = request.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ username: user.username, id: user.id }, secret_key, { expiresIn });
        response.json(token);
    } else {
        response.status(401).json({ error: 'Unauthorized' });
    }
});

app.post('/loginsession', (request, response)=>{
    const {username, password} = request.body;
    const user = users.find(u => u.username === username && u.password === password);
    if(user){
        request.session.user = user;
        response.json({message: 'Login successful'});
    }else{
        response.status(401).json({error: 'Unauthorized'});
    }
});

const require_auth_jwt = (request, response, next) => {
    const not_splitted_token = request.headers.authorization;
    const splitted = not_splitted_token.split(' ');
    const token = splitted[1];

    console.log("token : " + token);

    if (token) {
        jwt.verify(token, secret_key, (err, decodedToken) => {
            if (err) {
                return response.status(401).json({ error: 'unauthorized' });
            } else {
                request.user = decodedToken;
                next();
            }
        });
    } else {
        return response.status(401).json({ error: 'Unauthorized' });
    }
};

app.get('/getmarques', require_auth_jwt, (request, response) => {
    response.json(voitures.map(voiture => voiture.marque));
});

const require_auth_session = (request, response, next) => {
    if (request.session && request.session.user) {
        return next();
    } else {
        return response.status(401).json({ error: 'Unauthorized' });
    }
};

app.get('/getmodeles', require_auth_session, (request, response) => {
    response.json(voitures.map(voiture => voiture.modele));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});