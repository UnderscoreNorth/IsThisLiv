import express from 'express';
import cors from 'cors';
import teamRoutes from './route/teamRoutes.js';
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/api/teams', teamRoutes);

app.listen(port, () => {
  console.log(`IsThisLiv listening on port ${port}`)
})
 
export default app;
