const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mime = require('mime');
const path = require('path');
const {Pool} = require('pg');
const { log } = require('console');
const multer = require('multer')

app.set('view engine', 'ejs');
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));


app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/public', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.lookup(filePath);
      if (mimeType) {
        res.setHeader('Content-Type', mimeType);
      }
    }
  }));

  let users = [];
  
    
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'forNode',
    password: '1234',
    port: 5432,
  });
  
  pool.connect();
  
  pool.query('SELECT * FROM users', (err, res) => {
    if (err) {
      console.error('Xatolik:', err);
    } else {
      users.push(res.rows)
    }
  });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));


app.get('/login', (req,res)=>{
  res.render('login');
})
app.get('/', (req , res)=>{
    res.render('inner');
})
app.get('/about', (req , res)=>{
    res.render('about');
})
app.get('/contact', (req , res)=>{
    res.render('contact');
})
app.get('/cars', (req , res)=>{
    res.render('cars');
})
app.get('/settings', (req , res)=>{
  res.render('settings');
})
app.get('/add-users', (req , res)=>{
  res.render('addUser');
})
app.get('/login', (req , res)=>{
  res.render('login');
})
app.get('/addCategory', (req , res)=>{
  res.render('addCategory');
})
app.get('/addCars', (req , res)=>{
  res.render('addCars');
})

app.post('/login', (req, res)=>{
  const logName = req.body.logName;
  const logPassword =  req.body.logPassword;
  console.log(logName," || ", logPassword);
  res.redirect('/')
})

app.get('/user/:username', (req, res)=>{
    let data = {username: req.params.username, hobbies: ['football', 'tennis', 'basketball']}
    res.render('user', data)
})

app.post('/chek-user',(req,res)=>{
    let username = req.body.username;
    if(username == '')
        return res.redirect('/')
    else
        return res.redirect('/user/' + username)
})
app.use(express.urlencoded({ extended: true }));
app.get("/api/users",async (req, res)=>{
  try {
    const result = await pool.query("SELECT * FROM users");
    res.status(200).json(result.rows); 
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server error");
  }
})
app.post('/add/user', async (req, res) => {
  let userName = req.body.userName;
  let userPassword = req.body.userPassword;

  console.log(`username: ${userName} || password: ${userPassword}`);

  if (!userName || !userPassword) {
    return res.redirect('/');
  }

  try {
    const result = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *", [
      userName,
      userPassword,
    ]);

    if (result.rows.length > 0) {
      users.push(result.rows[0]);  // Yangi foydalanuvchini massivga qo‘shish
    }

    return res.redirect("/add-users");
  } catch (error) {
    console.error("Error inserting user:", error.message);
    return res.status(500).send("Server error");
  }
});
app.delete('/api/users/:id', async(req, res) => {
  const userDelete = parseInt(req.params.id);
  try{
      await pool.query("DELETE FROM users WHERE id = $1",[userDelete])
    
      if (Array.isArray(users) && Array.isArray(users[0])) {
        users[0] = users[0].filter((d) => d.id !== userDelete);
      } else {
        users = users.filter((d) => d.id !== userDelete);
      }
      res.json({ message: "Foydalanuvchi o'chirildi", users });
  }catch(error){
    console.error("Error deleting user:", error.message);
    res.status(500).send("Server error");
  }
});
app.put('/edit/users/:id', async (req, res) => {
  let editId = req.params.id;
  const { username , password } = req.body;
  console.log("DEMO ", username,"||", password, "ID:", editId);
  try{
      const result = await pool.query("UPDATE users SET username = $1, password = $2 WHERE id = $3 RETURNING *",[
        username, password, editId
      ])

      if(result.rowCount === 0){
        return res.status(404).json({error: "Foydalanuvchi topilmadi"})
      }
      res.json({staus : "Muvofaqiyatli yangilandi", user: result.rows[0]})

  } catch(error){
    console.log("ERROR",error);
    res.status(500).json({error: "serverda xatolik"})
  }
});

//TODO ADD CATEGORY
app.post('/add/category', async (req, res)=>{
  const categoryName = req.body.categoryName
  console.log("categoryName:", categoryName);
  try{
    const result = await pool.query("INSERT INTO category (name) VALUES ($1) RETURNING *", [categoryName]);
    console.log(result.rows);
    res.redirect('/addCategory')
  } catch(error){
    console.error("ERROR", error);
  }
})
    //? Create JSON to Category
    app.get('/api/categories', async (req,res)=>{
      try{
          const categories = await pool.query("SELECT * FROM category");
          res.status(200).json(categories.rows)
      } catch(error){
        console.error("ERROR", error);
        res.status(500).send("Server error");
      }
    }) 

    //? Delete category
    app.delete('/api/categories/:id', async (req, res)=>{
      const categoryId = parseInt(req.params.id);
      try{
          await pool.query("DELETE FROM category WHERE id = $1", [categoryId])
          res.json({message : "Categoriya o'chirildi"})
      } catch(error){
        console.error("ERROR delete category:" , error);
        res.status(500).json({message : "error"})
      }
    })
    //? Change Category Name
    app.put('/api/categories/:id', async (req, res)=>{
      let editId = req.params.id;
      const categoryName  = req.body.categoryName;
      console.log("DEMO ", categoryName,"||", editId);
      try{
          const result = await pool.query("UPDATE category SET name = $1 WHERE id = $2 RETURNING *",[
            categoryName,  editId
          ])

          if(result.rowCount === 0){
            return res.status(404).json({error: "Kategoriya topilmadi"})
          }
          res.json({staus : "Muvofaqiyatli yangilandi", category: result.rows[0]})

      } catch(error){
        console.log("ERROR",error);
        res.status(500).json({error: "serverda xatolik"})
      }
    })

//! Api Sold CARS
app.post('/post/cars', upload.single('file'), async (req, res) => {
  const { category, yearOfCar, colorOfCar, btnradio, probeg } = req.body;
  const filePath = req.file ? `/uploads/${req.file.filename}` : null; 
  const fileName = req.file.filename;
  console.log("Yuklangan fayl:", filePath, "Yuklangan fayl Nomi:", fileName);
  console.log("Form ma’lumotlari:", category, yearOfCar, colorOfCar, btnradio, probeg);

  try {
      const result = await pool.query(
          "INSERT INTO sold_cars (name, year, status, probeg, color, image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [category, yearOfCar, btnradio, probeg, colorOfCar, filePath]
      );
      console.log("Baza natijasi:", result.rows);
      res.redirect("/addCars");
  } catch (err) {
      console.error("Error:", err);
      res.status(500).send("Ma’lumotni saqlashda xatolik!");
  }
});
  //? Get Sold Cars 
app.get('/api/soldCars', async (req, res)=>{
    try{
      const result = await pool.query("SELECT * FROM sold_cars")
      res.json(result.rows)
    } catch(err){
      console.error("Error getting sold cars:", err);
    }
})
app.delete('/api/soldCars/delete/:id', async (req, res)=>{
  try{
    const carId = req.params.id;
    await pool.query("DELETE FROM sold_cars WHERE id = $1", [carId])
    res.json({message: "Muvofaqiyatli o'chirildi"})
  } catch(err){
    console.error("error:", err);
  }
})
app.post('/api/soldCars/edit/:id',upload.single('file'), async (req, res)=>{
  try{
    const carId = req.params.id;
    const {colorOfCarEdit, editCategoryName ,editCategoryNameText, probegEdit, selectedValue, yearOfCarEdit} = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null; 
    console.log(filePath);
    console.log("req.file",req.file);
    const result = await pool.query("UPDATE sold_cars SET name = $1,year = $2,status = $3,probeg = $4, color = $5 ,image_path = $6, category_id =$7  WHERE id = $8", 
    [editCategoryNameText, yearOfCarEdit,selectedValue,probegEdit, colorOfCarEdit,  filePath, editCategoryName,carId])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mashina topilmadi!" });
    }
    res.json({ message: "Mashina yangilandi!"});
  } catch(err){
    console.error("error:", err);
  }
})


let data = [{
    id: 1,
    name: "Jonibek",
    age: 18,
    hobbies: ["football", "coding", "reading"]
  }]

app.get('/api/data',(req,res)=>{
    res.json(data);
})
app.post('/api/data',(req, res)=>{
    const newUser = {
        id: data.length + 1,
        name: req.body.name,
        age: req.body.age,
        hobbies: req.body.hobbies
    }
    data.push(newUser)
    res.status(201).json(newUser)
})
app.delete('/api/data/:id', (req, res)=>{
    const userId =  parseInt(req.params.id)
    data = data.filter(d => d.id !== userId)
    res.json({ message: "Foydalanuvchi o'chirildi" })
})


app.use((req, res, next)=>{
    res.status(404).render('error')
    next()
})

const HOST = 5000

app.listen(HOST,()=>{
    console.log(`http://localhost:${HOST}`);
})