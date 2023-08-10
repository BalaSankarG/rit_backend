const express =require('express');

const bodyParser = require('body-parser');

const csv = require('fast-csv');

const fs =require('fs');

const path = require('path');

const multer =require('multer');

const mysql =require("mysql");

const app = express();

app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination:(req,file,callback) =>{
        callback(null,"./uploads")
    },
    filename:(req,file,callback) =>{
        callback(null,file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage
});



const pool =mysql.createPool({
    host:"localhost",
    user:"root",
    password:"",
    database:"backend"


})
app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/index.html")
})
app.post('/upload', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const { batch, regulation, semester, section } = req.body;

    uploadsCsv(filePath, batch, regulation, semester, section);

    res.status(200).send('File uploaded and data inserted.');
    
});


function uploadsCsv(filePath,batch,regulation,semester,section){
    let stream = fs.createReadStream(filePath);
    let csvDataColl = [];
    let fileStream = csv
    .parse()
    .on('data',function(data){
        csvDataColl.push(data);
    })
    .on('end',function(){
        csvDataColl.shift();

        pool.getConnection((error,connection)=>{
            if(error){
                console.log(error);
            }
            else{
                let query = "INSERT INTO datas (degree_code	,batch_no,dept_name,regu_no,sem,course_code,sec)VALUES ? "
                const dataToInsert = csvDataColl.map((row) => [row[0], batch, row[1], regulation, semester, row[2], section]);
                connection.query(query,[dataToInsert],(error,res)=>{
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Data inserted successfully.');
                    }

                    connection.release();

                });


            }


        });
    });
    stream.pipe(fileStream);


}

app.listen(5000,() =>{
    console.log("App is listening on port 5000");
});