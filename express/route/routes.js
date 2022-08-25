import express from 'express';
import * as h from '../lib/helper.js';
import fs from 'fs/promises';

import cupModels from '../model/cupModels.js';
import teamModels from '../model/teamModels.js';
import sqlModels from '../model/sqlModels.js';
import repeatGroups from '../model/misc/repeatGroups.js';
import mostDangerousLead from '../model/misc/mostDangerousLead.js';
import subbedPlayers from '../model/misc/subbedPlayers.js'
import benchWarmers from '../model/misc/benchWarmers.js';

const router = express.Router();
router.use('/cups/:cupID', cupModels.cup);
router.use('/cups', cupModels.main);
router.use('/teams', teamModels.main);
router.use('/sql/matchDisplay/:matchID', sqlModels.matchDisplay);
router.use('/misc/',loadCache);
router.use('/misc/repeat_groups',repeatGroups.main);
router.use('/misc/most_dangerous_lead',mostDangerousLead.main);
router.use('/misc/subbed_players',subbedPlayers.main);
router.use('/misc/bench_warmers',benchWarmers.main);

async function loadCache(req,res,next){
    let stats = await fs.stat(req.staticUrl).catch((err)=>{
        return {mtime:new Date('01/01/2000')};
    });
    if(new Date() - stats.mtime > h.pageExpiry){
        next();
    } else {
        res.send(JSON.parse(await fs.readFile(req.staticUrl)));   
    }
}

export {router as default};