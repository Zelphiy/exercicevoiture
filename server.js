const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache')
require('dotenv').config();

const app = express();
const port = 3000;
const secret_key = process.env.SECRET_JWT;
const cache = new NodeCache({stdTTL: 60});

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
    {marque: "Toyota", modele: "Corolla", plaqueImmatriculation: "AB-123-CD", anneeFabrication: 2019},
    {marque: "Ford", modele: "Focus", plaqueImmatriculation: "EF-456-GH", anneeFabrication: 2018},
    {marque: "Honda", modele: "Civic", plaqueImmatriculation: "IJ-789-KL", anneeFabrication: 2020},
    {marque: "Volkswagen", modele: "Golf", plaqueImmatriculation: "MN-012-OP", anneeFabrication: 2017}
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

function check_data(request, response, next){
    const{plaqueImmatriculation} = request.body;
    const key = plaqueImmatriculation;
    const cacheData = cache.get(key);

    if(cacheData !== undefined){
        response.json({cacheData,
        message: 'Data send from cache : data from database'});
    }else{
        next();
    }
};

app.get('/data', check_data, (request, response)=>{
    const{plaqueImmatriculation} = request.body;
    for (let i =0; i<voitures.length; i++){
        const voiture = voitures[i];
        if(voiture.plaqueImmatriculation == plaqueImmatriculation){
            cache.set(plaqueImmatriculation,voiture);
            response.json({
                voiture,
                message: 'Data send from server : data from database'
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});