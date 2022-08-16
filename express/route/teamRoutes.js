import express from 'express';
import teamModels from '../model/teamModels.js';
const router = express.Router();
const routes = [''];
for(let route of routes){
    console.log(route);
    let modelRoute = (route ? route : 'main');
    router.use(`${route}`, teamModels[modelRoute]);
}
export {router as default};