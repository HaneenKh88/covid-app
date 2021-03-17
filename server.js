'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const MethodOverride = require('method-override');

const app = express();

require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(MethodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);



const PORT = process.env.PORT || 3000;


//route
app.get('/' , HomeHandler);
app.get('/getCountryResult', getCountryResultHandler)
app.get('/AllCountries' , AllCountriesHandler)
app.post ('/MyRecords' , insertMyRecordHandler)
app.get ('/MyRecords' , renderMyRecordHandler)
app.get('/detail/:id' , RecorsDetailHandler)
app.delete('/delete/:id' , RecorsDeleteHandler)

// Handler

function HomeHandler(req,res)
{
   let url = `https://api.covid19api.com/world/total`;
   superagent.get(url)
   .then(result =>
    {
        res.render('pages/Home', {data: result.body});
    })
}


function getCountryResultHandler(req,res)
{
    let {country,from,to} = req.query;
    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
   superagent.get(url)
   .then(result =>
    {
        let ResultArr = result.body.map(item =>
            {
               return new GetCountry(item);
            })
        res.render('pages/GetCountryResult', {data: ResultArr});
    })
}

function AllCountriesHandler(req,res)
{
  let url = `https://api.covid19api.com/summary`;
  superagent.get(url)
   .then(result =>
    {
        let ResultArr = result.body.Countries.map(item =>
            {
               return new AllCountries(item);
            })
        res.render('pages/AllCountries', {data: ResultArr});
    })
}

function insertMyRecordHandler(req,res)
{
    let {country, totalConfirmed, totalDeaths, totalRecovered, date} = req.body;
    let SQL = `INSERT INTO countries (country, totalConfirmed, totalDeaths, totalRecovered, date) VALUES ($1,$2,$3,$4,$5);`;
    let values = [country, totalConfirmed, totalDeaths, totalRecovered, date];

    client.query(SQL,values)
    .then(data =>
        {
           
            res.redirect('/MyRecords');
        })
}

function renderMyRecordHandler(req,res)
{
   
    let SQL = `SELECT * FROM countries;`;
    client.query(SQL)
    .then(data =>
        {
            console.log(data.rows);
            res.render('pages/MyRecords' , {data: data.rows});
        })
}


function RecorsDetailHandler(req,res)
{
    let id = req.params.id;
    let SQL = `SELECT * FROM countries WHERE id=$1;`;
    let value = [id];
    client.query(SQL, value)
    .then(data =>
        {
           
            res.render('pages/RecordDetail' , {data: data.rows[0]});
        })
}

function RecorsDeleteHandler(req,res)
{
    let id = req.params.id;
    let SQL = `DELETE FROM countries WHERE id=$1;`;
    let value = [id];
    client.query(SQL, value)
    .then(data =>
        {
           
            res.redirect(`/detail/${id}`);
        })
}
//constructor

function GetCountry(data)
{
    this.country = data.Country;
    this.cases = data.Cases;
    this.date = data.Date;
}

function AllCountries(data)
{
    this.country = data.Country;
    this.totalConfirmed = Number(data.TotalConfirmed) + Number(data.NewConfirmed);
    this.totalDeaths = Number(data.TotalDeaths) + Number(data.NewDeaths);
    this.totalRecovered = Number(data.TotalRecovered) + Number(data.NewRecovered);
    this.date = data.Date;

}

client.connect()
.then(() =>
{
    app.listen(PORT , () =>
    {
        console.log(`listining on port ${PORT}`);
    })
})

