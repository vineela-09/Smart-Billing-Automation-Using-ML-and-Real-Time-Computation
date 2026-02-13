import jwt from "jsonwebtoken";
const JWT = process.env.JWT_SECRET || "devsecret";
export default function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({ message: 'No token' });
  const token = h.split(' ')[1];
  try{
    const p = jwt.verify(token, JWT);
    req.userId = p.id;
    next();
  }catch(e){ res.status(401).json({ message: 'Invalid token' }); }
}
