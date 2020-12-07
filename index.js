// Add required packages
const fileUpload = require("express-fileupload");
const multer = require("multer");
const upload = multer();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();

require("dotenv").config();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: "rivujbkgsjepag",
  host: "ec2-52-203-182-92.compute-1.amazonaws.com",
  database: "daugr69nq5ihri",
  password: "00b8aed21944169b917597734278b701bdcbe8ec465025bcd0aa7d3df9b189c3",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});
console.log("Successful connection to the database");

//Creating the customer table (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev)
const sql_create = `CREATE TABLE IF NOT EXISTS customer (
    cusId INTEGER PRIMARY KEY,
    cusFname VARCHAR(20) NOT NULL,
    cusLname VARCHAR(30) NOT NULL,
    cusState CHAR(2),
    cusSalesYTD  MONEY,
	cusSalesPrev MONEY
);`;
pool.query(sql_create, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'customer' table");
});

// Database seeding
const sql_insert = `INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES
(101, 'Alfred', 'Alexander', 'NV', 1500, 900),
(102, 'Cynthia', 'Chase', 'CA', 900, 1200),
(103, 'Ernie', 'Ellis', 'CA', 3500, 4000),
(104, 'Hubert', 'Hughes', 'CA', 4500, 2000),
(105, 'Kathryn', 'King', 'NV', 850, 500),
(106, 'Nicholas', 'Niles', 'NV', 500, 400),
(107, 'Patricia', 'Pullman', 'AZ', 1000, 1100),
(108, 'Sally', 'Smith', 'NV', 1000, 1100),
(109, 'Shelly', 'Smith', 'NV', 2500, 0),
(110, 'Terrance', 'Thomson', 'CA', 5000, 6000),
(111, 'Valarie', 'Vega', 'AZ', 0, 3000),
(112, 'Xavier', 'Xerox', 'AZ', 600, 250)
ON CONFLICT DO NOTHING;`;
pool.query(sql_insert, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  const sql_sequence =
    "SELECT SETVAL('customer_cusId_Seq', MAX(cusId)) FROM customer;";
  pool.query(sql_sequence, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Successful creation of customers");
  });
});

function convertCurrencytoString(currency) {
  var temp = "";
  for (var i = 0; i < currency.length; i++) {
    if (currency[i] === ".") break;
    if (Number.isInteger(parseInt(currency[i]))) {
      temp += currency[i];
    }
  }
  return temp;
}

// Start listener
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/customers", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusId";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    const data = [];
    res.render("customers", {
      model: result.rows,
      display: false,
      data: data,
      found: 0,
    });
  });
});

app.post("/customers", (req, res) => {
  const id = req.body.id;
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const state = req.body.state;
  const salesytd = req.body.salesytd;
  const previousyear = req.body.previousyear;
  const data = [id, firstname, lastname, state, salesytd, previousyear];
  if (
    id === "" &&
    firstname === "" &&
    lastname === "" &&
    state === "" &&
    salesytd === "" &&
    previousyear === ""
  ) {
    const sql = "SELECT * FROM customer ORDER BY cusId";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("customers", {
        model: result.rows,
        dataFound: result.rows,
        data: data,
        display: true,
        found: 0,
      });
    });
  } else {
    const sql = "SELECT * FROM customer ORDER BY cusId";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      for (var i = 0; i < data.length; i++) {
        if (data[i] != "") {
          var temp;
          var arr = [];
          if (i == 0) temp = "cusid";
          else if (i == 1) temp = "cusfname";
          else if (i == 2) temp = "cuslname";
          else if (i == 3) temp = "cusstate";
          else if (i == 4) temp = "cussalesytd";
          else if (i == 5) temp = "cussalesprev";
          for (var j = 0; j < result.rows.length; j++) {
            var stringtest = result.rows[j][temp];
            // Search are not case sensitive
            if (stringtest.toString().toLowerCase() === data[i].toLowerCase()) {
              arr.push(result.rows[j]);
              break;
            }
          }
          if (arr.length == 0) {
            res.render("customers", {
              model: result.rows,
              dataFound: arr,
              display: false,
              data: data,
              found: 1,
            });
          } else {
            res.render("customers", {
              model: result.rows,
              dataFound: arr,
              display: true,
              data: data,
              found: 0,
            });
          }
          break;
        }
      }
    });
  }
});

app.get("/create", (req, res) => {
  const data = [];
  var error = "";
  var begin = true;
  res.render("create", {
    data: data,
    error: error,
    begin: begin,
  });
});

app.post("/create", (req, res) => {
  const data = [
    req.body.id,
    req.body.firstname,
    req.body.lastname,
    req.body.state,
    req.body.salesytd,
    req.body.previousyear,
  ];
  data[0] = parseInt(data[0]);
  var error = "";
  var begin = false;
  const sql =
    "INSERT INTO customer (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES ($1, $2, $3, $4, $5, $6)";
  pool.query(sql, data, (err, result) => {
    if (err) {
      //return console.error(err.message);
      error = err.message;
    }
    res.render("create", {
      data: data,
      error: error,
      begin: begin,
    });
  });
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id; // integer number already
  const sql = "SELECT * FROM customer WHERE cusId = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    var status = "";
    result.rows[0].cussalesytd = convertCurrencytoString(
      result.rows[0].cussalesytd
    );
    result.rows[0].cussalesprev = convertCurrencytoString(
      result.rows[0].cussalesprev
    );
    res.render("delete", { data: result.rows[0], status: status });
  });
});

app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const data = [
    {
      cusid: req.body.id,
      cusfname: req.body.firstname,
      cuslname: req.body.lastname,
      cusstate: req.body.state,
      cussalesytd: req.body.salesytd,
      cussalesprev: req.body.previousyear,
    },
  ];
  const sql = "DELETE FROM customer WHERE cusId = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    var status = "Customer Deleted Successfully!";
    res.render("delete", { data: data[0], status: status });
  });
});

app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM customer WHERE cusId = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    result.rows[0].cussalesytd = convertCurrencytoString(
      result.rows[0].cussalesytd
    );
    result.rows[0].cussalesprev = convertCurrencytoString(
      result.rows[0].cussalesprev
    );
    res.render("edit", { data: result.rows[0], status: "" });
  });
});

app.post("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const data = [
    {
      cusid: req.body.id,
      cusfname: req.body.firstname,
      cuslname: req.body.lastname,
      cusstate: req.body.state,
      cussalesytd: req.body.salesytd,
      cussalesprev: req.body.previousyear,
    },
  ];
  var dataUpdate = [
    data[0].cusid,
    data[0].cusfname,
    data[0].cuslname,
    data[0].cusstate,
    data[0].cussalesytd,
    data[0].cussalesprev,
  ];
  const sql =
    "UPDATE customer SET cusFname = $2, cusLname = $3, cusState = $4, cussalesytd = $5, cussalesprev = $6 WHERE (cusid = $1)";
  pool.query(sql, dataUpdate, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    var status = "Customer Updated Successfully!";
    res.render("edit", { data: data[0], status: status });
  });
});

app.get("/reports", (req, res) => {
  res.render("report", {
    data: [],
    value: "1",
    show: false,
    status: "",
  });
});

app.post("/reports", (req, res) => {
  const valueOption = req.body.valueOption;
  //console.log(valueOption);
  if (valueOption === "1") {
    const sql = "SELECT * FROM customer ORDER BY cusFname ASC, cusLname ASC;";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("report", {
        data: result.rows,
        value: valueOption,
        show: true,
        status: "",
      });
    });
  } else if (valueOption === "2") {
    const sql = "SELECT * FROM customer ORDER BY cusSalesYTD DESC;";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      //console.log(result.rows);
      res.render("report", {
        data: result.rows,
        value: valueOption,
        show: true,
        status: "",
      });
    });
  } else if (valueOption === "3") {
    const sql = "SELECT * FROM customer ORDER BY random() limit 3";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      //console.log(result.rows);
      var show = true;
      var status = "";
      if (result.rows.length < 3) {
        show = false;
        status = "We don't have enough 3 customers now!";
      }
      res.render("report", {
        data: result.rows,
        value: valueOption,
        show: show,
        status: status,
      });
    });
  }
});

app.get("/import", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusId";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("import", {
      model: result.rows,
    });
  });
});

app.post("/import", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    message = "Error: Import file not uploaded";
    return res.send(message);
  }
  var message = "Import Summary";
  //Read file line by line, inserting records
  const fn = req.files.filename;
  const buffer = fn.data;
  const lines = buffer.toString().split(/\r?\n/);
  var errmess = "Errors:";
  var countError = 0;

  lines.forEach((line) => {
    product = line.split(",");
    const sql =
      "INSERT INTO customer(cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev) VALUES ($1, $2, $3, $4, $5, $6)";
    pool.query(sql, product, (err, result) => {
      if (err) {
        console.log(err);
        errmess = `Customer ID: ${err.detail} - Error message: ${err.message}`;
        console.log(errmess);
        countError++;
      } else {
        console.log(`Inserted successfully`);
      }
    });
  });

  var countSuccess = lines.length - countError;
  message += `\nRecords Processed: ${lines.length} records`;
  message += `\nRecords Inserted successfully: ${countSuccess}`;
  if (countError !== 0) {
    message += `\nRecords: Not Inserted: ${countError}`;
    message += errmess;
  }
  res.send(message);
});

app.get("/export", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusId";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("export", {
      model: result.rows,
      message: "",
    });
  });
});

app.post("/export", (req, res) => {
  const sql = "SELECT * FROM customer ORDER BY cusId";
  pool.query(sql, [], (err, result) => {
    var message = "";
    if (err) {
      message = `Error - ${err.message}`;
      res.render("output", { message: message });
    } else {
      var output = "";
      result.rows.forEach((product) => {
        output += `${product.cusid},${product.cusfname},${product.cuslname},${product.cusstate},${product.cussalesytd},${product.cussalesprev}\r\n`;
      });
      res.header("Content-Type", "text/csv");
      res.attachment("export.csv");
      return res.send(output);
    }
  });
});
