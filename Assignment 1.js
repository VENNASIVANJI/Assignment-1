mkdir backend
cd backend
npm init -y
npm install express sqlite3 body-parser cors
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS spreadsheet (id INTEGER PRIMARY KEY, data TEXT)");
});

app.post("/save", (req, res) => {
    const data = JSON.stringify(req.body.data);
    db.run("INSERT INTO spreadsheet (data) VALUES (?)", [data], function(err) {
        if (err) {
            res.status(500).send({ error: "Failed to save data" });
            return;
        }
        res.status(200).send({ message: "Data saved successfully" });
    });
});

app.get("/load", (req, res) => {
    db.all("SELECT * FROM spreadsheet", (err, rows) => {
        if (err) {
            res.status(500).send({ error: "Failed to load data" });
            return;
        }
        res.status(200).send({ data: rows[0]?.data ? JSON.parse(rows[0].data) : [] });
    });
});

const port = 5000;
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
npx create-react-app frontend
cd frontend
npm install handsontable chart.js axios
import React, { useState, useEffect } from "react";
import axios from "axios";
import Handsontable from "handsontable";
import Chart from "chart.js/auto";
import "handsontable/dist/handsontable.full.css";

const App = () => {
    const [spreadsheetData, setSpreadsheetData] = useState([]);
    const [chartData, setChartData] = useState({});
    
    useEffect(() => {
        axios.get("http://localhost:5000/load")
            .then(response => {
                const data = response.data.data || [];
                setSpreadsheetData(data);
                initHandsontable(data);
            })
            .catch(error => console.error("Error loading data:", error));
    }, []);

    const initHandsontable = (data) => {
        const container = document.getElementById("spreadsheet");
        const hot = new Handsontable(container, {
            data: data,
            rowHeaders: true,
            colHeaders: true,
            licenseKey: "non-commercial-and-evaluation",
            contextMenu: true,
            formulas: true, 
            columnSorting: true,
            manualColumnResize: true,
            manualRowResize: true,
        });
    };

    const handleSave = () => {
        axios.post("http://localhost:5000/save", { data: spreadsheetData })
            .then(response => alert("Data saved successfully"))
            .catch(error => alert("Error saving data"));
    };

    const generateChart = () => {
        const ctx = document.getElementById("myChart");
        const chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: spreadsheetData.map(row => row[0] || ""),
                datasets: [
                    {
                        label: "Spreadsheet Data",
                        data: spreadsheetData.map(row => row[1] || 0),
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
        setChartData(chart);
    };

    return (
        <div className="App">
            <div id="spreadsheet" style={{ marginBottom: "20px" }}></div>
            <button onClick={handleSave}>Save</button>
            <button onClick={generateChart}>Generate Chart</button>
            <canvas id="myChart" style={{ maxWidth: "600px", marginTop: "20px" }}></canvas>
        </div>
    );
};

node server.js
npm start
