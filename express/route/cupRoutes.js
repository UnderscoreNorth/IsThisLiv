import express from 'express';
import cupModels from '../model/cupModels.js';
const router = express.Router();
const routes = {main:'/+',cup:'/',};
for(let model in routes){
    let route = routes[model];
    router.use(route, cupModels[model]);
}
export {router as default};