const express = require('express'); 
const mysql = require('mysql2'); 
const multer = require('multer')
const PORT = process.env.PORT || 3000
const moment = require('moment')
const app = express()

//create mysql collection 
/*const connection = mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'c237_journal'
})*/

const connection = mysql.createConnection({ 
    host: 'db4free.net', 
    user: 'c237_cx', 
    password: 'a8jjneqoo', 
    database: 'c237_cx'
})
connection.connect((err) => { 
    if (err) { 
      console.error(`Error when connecting to mysql: ${err}`); 
    }
    console.log("Successfully connected to Mysql")
  }); 
  
//setup view enginer
app.set("view engine", 'ejs'); 

//enable static files
app.use(express.static('public'));

app.use(express.static(__dirname + '/views'));

app.use(express.urlencoded({ 
    extended: false
})); 

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
}); 
const upload = multer({storage:storage})
app.get('/', (req, res) => { 
    res.render('index')
})

app.get('/addPost', (req, res) => { 
    res.render('addPost')
})

app.post('/addPost', upload.single('journal_photo'), (req, res) => {
    
    //extract student details from the request body
     const {title, entry_date, journal_desc } = req.body 
     
     let journal_photo = req.body.currentImage 
     if(req.file) { 
         journal_photo = req.file.filename
     } else { 
         journal_photo = null
     }

     const sql = 'INSERT INTO journal (journal_title, journal_date, journal_description, journal_photo) VALUES (?, ?, ?, ?)'
 
     connection.query(sql, [title, entry_date, journal_desc, journal_photo], (error, results) => { 
         if(error) { 
             console.error("Database query error: ", error.message)
             return res.status(500).send('Error Inserting students')
         } 
         req.app.locals.specialContext = "Your journal has been added"
         res.redirect('/viewPost');
         
     })
 })

app.get('/viewPost', (req, res) => { 
    var context = req.app.locals.specialContext
  req.app.locals.specialContext = null
    const sql = "SELECT * FROM journal";
    connection.query(sql, (error, results) => { 
        if(error) { 
            console.error("Database query error: ", error.message)
            return res.status(500).send('Error Retrieving journals')
        }
        let formattedDate = moment(results[0].journal_date).format('YYYY-MM-DD')
        res.render('viewPost', {journal: results, formattedDate:formattedDate, context: context})
        })
})

//update one journal [R]
app.get('/editPost/:id', (req, res) => {
    const journalId = req.params.id; 
    const sql = 'SELECT * FROM journal where journal_id = ?'

    connection.query(sql, [journalId], (error, results) => { 
        if (error) { 
            console.error("Database query error:", error.message)
            return res.status(500).send("Error retrieving journal by id")
        }
      if (results.length > 0) { 
        let formattedDate = moment(results[0].journal_date).format('YYYY-MM-DD');
        res.render("editPost", {journal: results[0], formattedDate:formattedDate})
      } else { 
        res.status(404).send("Journal not found")
      }
    })
 }); 
//after clicking the btn
 app.post('/editPost/:id',upload.single('journal_photo'), (req, res) => { 
    const journal_id = req.params.id; 
    const {title, entry_date, journal_desc } = req.body 
    
   //handle upload of image 
   let journal_photo = req.body.currentImage;
   if (req.file) {
    journal_photo = req.file.filename
   }

   const sql = 'UPDATE journal SET journal_title = ?, journal_date= ?, journal_description = ?, journal_photo = ? WHERE journal_id = ?'
    //execute query to update data
    connection.query(sql, [title, entry_date, journal_desc, journal_photo, journal_id], (error, results) => { 
        if (error) { 
            console.error("Database query error:", error.message)
            return res.status(500).send("Error updating journal")
        }

        else { 
            res.redirect('/viewPost')
        }
    })
})
app.get('/deletePost/:id', (req, res) => { 
    //retrieve student id from req param 
    const journal_id = req.params.id 
    const sql = 'DELETE FROM journal WHERE journal_id = ?'

    connection.query(sql, [journal_id], (error, results) => { 
        if (error) { 
            console.error("Database query error:", error.message)
            return res.status(500).send("Error deleting journal by id")
        }
        else { 
            res.redirect('/viewPost')
        }
    })
})
app.listen(PORT, ()=>console.log(`Server is running @ http://localhost:${PORT}`))