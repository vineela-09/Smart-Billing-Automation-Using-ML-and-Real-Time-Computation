import MathOperation from "../models/MathOperation.js";

export const createMathOperation = async (req, res) => {
  try {
    const { expression, result, operationType, displayExpression } = req.body;
    const userId = req.user.id;

    const mathOp = new MathOperation({
      user: userId,
      expression,
      result,
      operationType: operationType || "voice_math",
      displayExpression: displayExpression || `${expression} = ${result}`,
      source: "voice",
    });

    await mathOp.save();
    res.json({ success: true, message: "Math operation saved", data: mathOp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listMathOperations = async (req, res) => {
  try {
    const userId = req.user.id;
    const operations = await MathOperation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: operations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMathOperationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await MathOperation.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$operationType",
          count: { $sum: 1 },
          results: { $push: "$result" },
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
