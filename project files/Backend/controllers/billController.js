import Bill from "../models/Bill.js";
export const createBill = async (req,res)=>{
  try{
    const { items, total } = req.body;
    const bill = await Bill.create({ user: req.userId, items, total });
    res.json(bill);
  }catch(err){ res.status(500).json({ message: 'Server error' }); }
};
export const listBills = async (req,res)=>{
  try{
    const bills = await Bill.find({ user: req.userId }).sort({ createdAt:-1 });
    res.json(bills);
  }catch(err){ res.status(500).json({ message: 'Server error' }); }
};
