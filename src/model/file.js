var mongoose = require("mongoose");

var historyItemSchema = mongoose.Schema({
  date: { type: Number, required: true },
  ipAddress: { type: String, trim: true },
  reason: { type: String, trim: true }
});

var fileSchema = mongoose.Schema({
  idInDatabase: {
    type: String,
    required: true,
    index: true
  },
  nameInDatabase: {
    type: String,
    required: true
  },
  localPath: {
    type: String,
    required: true,
    index: true
  },
  owner: {
    type: "ObjectId",
    required: true,
    index: true
  },
  block: {
    type: "ObjectId",
    required: true
  },
  bucket: {
    type: "ObjectId",
    required: true
  },
  upload: {
    started: { type: Number },
    paused: {
      type: Number,
      validate: v => !this.upload.finished && v > this.upload.started
    },
    finished: {
      type: Number,
      validate: v => !this.upload.paused && v > this.upload.started
    }
  },
  download: {
    started: { type: Number, required: true },
    paused: {
      type: Number,
      validate: v => !this.download.finished && v > this.download.started
    },
    finished: {
      type: Number,
      validate: v => !this.download.paused && v > this.download.started
    }
  },
  binned: {
    type: Boolean,
    default: false
  },
  pendingDeletion: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  originalSize: {
    type: Number,
    min: 0,
    required: true
  },
  latestSize: {
    type: Number,
    min: 0,
    default: this.originalSize
  },
  versions: {
    type: [
      {
        idInDatabase: {
          type: String,
          required: true
        },
        dateInserted: {
          type: Number,
          required: true
        },
        dateDeleted: {
          type: Number
        },
        originalSize: {
          type: Number,
          required: true
        }
      }
    ],
    default: []
  },
  log: {
    detected: {
      type: Number, // date detected
      index: true
    },
    updateHistory: {
      type: [historyItemSchema],
      default: []
    },
    binnedHistory: {
      type: [historyItemSchema],
      default: []
    },
    restoredHistory: {
      type: [historyItemSchema],
      default: []
    },
    lastestSizeCalculationDate: {
      type: Number
    },
    sizeHistory: {
      type: [
        {
          date: { type: Number, required: true },
          size: { type: Number, required: true }
        }
      ],
      default: []
    },
    dateDeleted: {
      type: Number
    },
    lastModifiedTime: {
      type: Number
    }
  }
});

var File = (module.exports = mongoose.model("File", fileSchema));
