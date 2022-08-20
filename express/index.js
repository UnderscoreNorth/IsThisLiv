import express from 'express';
import cors from 'cors';
import teamRoutes from './route/teamRoutes.js';
import cupRoutes from './route/cupRoutes.js';
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/',middleware)
app.use('/api/teams', teamRoutes);
app.use('/api/cups', cupRoutes);

function middleware(req,res,next){
  req.staticUrl = 'build/' + req.url.replace(/\//g,"__") + '.json';
  next();
}

app.listen(port, () => {
  console.log(`IsThisLiv listening on port ${port}`)
})
 
export default app;
