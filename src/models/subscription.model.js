import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      // one who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      // one to whom subscriber is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  // making seperate entry in db rather than keeping subscriber in array as subscriber can be more than a million
  //while finding subscriber count the doucment with the same channel not subscriber
  // for finding whom the user has subcriber we find document with same subsscriber and take out channel list
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
