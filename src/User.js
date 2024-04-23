import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  tgId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  isBot: {
    type: Boolean,
    required: true
  },
  promptTokens: {
    type: Number,
    required: false
  },
  completionTokens: {
    type: Number,
    required: false
  }
}, {timestamps: true});

export default mongoose.model("User", UserSchema);
