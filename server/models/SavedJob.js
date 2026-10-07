const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
  },
  { timestamps: true }
);

savedJobSchema.index(
  { student: 1, job: 1 },
  { unique: true }
);

module.exports = mongoose.model("SavedJob", savedJobSchema);