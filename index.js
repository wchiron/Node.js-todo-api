const express = require("express");// express is to make an http server, this line import an library
const app = express(); //create a new express server
// const port = 3000;  // set the port at 3000

// ------ build access to the database
const { Client } = require("pg"); // find the pg sql
const client = new Client({ // create a pgsql client 
    // database: "todolist", // look for a database called todolist
    connectionString: process.env.DATABASE_URL, // to put the project in Heroku, link the api to the PostgreSQL
    ssl: true,
});
client.connect();
//-------------



app.use('*', (req, res, next) => {
    res.header('access-control-allow-origin', '*'); // To allow JavaScript from any website to use this API
    res.header('access-control-allow-methods', 'GET, POST, DELETE, PATCH'); // To allow JavaScript to use GET/POST/DELETE methods
    res.header('access-control-allow-headers', 'content-type'); // To allow JavaScript to use GET/POST/DELETE methods
    next();
});

app.use(express.json()); // to get the information throught the API in the form of json

app.get('/todo', (req,res) => { // the combination of method (get) and path (/todo) is called a route/path
    // res.send(todoListItems)
    client.query("SELECT * FROM todos WHERE deleted_date is null ORDER BY id", (err, result) => { // without the order by id, the database will send back the todo list in a random order.
        res.send(result.rows); // send the result from PostgreSQL to the localhost api for axios to get
    })
}); // /todo is a route, When receive get request, in reponse (database) send the content
app.post('/todo', (req,res) => { //When receive post request(an item gets added), add the content sent with the request to the array (database)
    // todoListItems.push(req.body);
    // res.status(200).send(); // status 200 means the request is a success. always reply with a status code to indicate the status of the request
    client.query("INSERT into todos(title, completed, deleted_date) VALUES($1, false, null) RETURNING *", [req.body.title], (err, result) => { // only need to send the infomation of the title to the database as the completed will be false by default. Returning * is a postgreSQL function which will return the inserted row
        res.send(result.rows[0]); // send the inserted row to the react app to show in the html page, since it's an array which contains the newly inserted information, need to add [0] to make sure sending the right info back instead of a whole database table
    })
});
app.delete('/todo/:itemID', (req, res) => {
    // todoListItems.splice(req.params.itemID,1);//array.splice(index, howmany, item1, ....., itemX), index means add the item into that specific position from the end of the array. howmany is option, if it's 0, no items will be removed.Here the index is the itemID because in this application, we used the item index as id. 
    client.query("UPDATE todos SET deleted_date = now() WHERE id = $1", [req.params.itemID], (err, result) => {
        if (err) {
            console.error("Fail to delete item", err);
            res.status(500).send();
        } else {
            res.status(200).send();
        }
    })
});
app.patch('/todo/:itemID', (req, res) => {
    client.query("UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *", [req.body.completed, req.params.itemID], (err, result) => { // return back the new todo list with the completed information updated, so the react app could get the infomation and update the html page
        if (err) {
            console.error("Fail to update item", err);
        }
        res.send(result.rows[0]);
    })
}) 



app.listen(process.env.PORT,() => console.log('Example, app started')); // this line make the api listen to the port 3000
