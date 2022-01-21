const csvtojson = require("csvtojson");
const mongodb = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploads = multer({ storage: storage });

//template engine
app.set("view engine", "ejs");

//fetch data from the request
app.use(bodyParser.urlencoded({ extended: false }));

//static folder
app.use(express.static(path.resolve(__dirname, "public")));

// Home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//mongodb
const url = "mongodb://localhost:27017/CompanyDb";
let db;
mongodb.MongoClient.connect(url, {
  useUnifiedTopology: true,
})
  .then((client) => {
    console.log("DB Connected!");
    db = client.db();
  })
  .catch((err) => {
    console.log("DB Connection Error: ${err.message}");
  });

app.post("/uploadfile", uploads.single("uploadfile"), (req, res) => {
  // CSV file name
  const fileName = `public/uploads/${req.file.filename}`;
  // console.log(fileName);
  let arrayToInsert = [];
  csvtojson()
    .fromFile(fileName)
    .then((source) => {
      //console.log(source);
      //Fetching the all data from each row
      for (let i = 0; i < source.length; i++) {
        let oneRow = {
          firstName: source[i]["firstname"],
          lastName: source[i]["lastname"],
          city: source[i]["city"],
          salary: source[i]["salary"],
        };
        arrayToInsert.push(oneRow);
      }
      //inserting into the table "employees"
      let collectionName = "employees";
      let collection = db.collection(collectionName);
      collection.insertMany(arrayToInsert, (err, result) => {
        if (err) console.log(err);
        if (result) {
          console.log("Import CSV into database successfully");
        }
      });
    });

  res.redirect("/");

  console.log(res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("server run at port " + port));
