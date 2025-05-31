import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: String,
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }
});

const Message = mongoose.model("Message", messageSchema);
export default Message;