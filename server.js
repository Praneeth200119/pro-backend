const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const app = express()
const sqlite3 = require('sqlite3')
const jwt = require('jsonwebtoken')

const cors = require('cors');


app.use(express.json({ limit: '5mb' }));  
app.use(express.urlencoded({ extended: true, limit: '5mb' })); 

app.use(cors());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
}));
const dbpath = path.join(__dirname,"productsDb.db")

let db = null

const initilizeServerWithDb = async() =>{
    try{
        db = await open({
            filename: dbpath,
            driver:sqlite3.Database
        });
        app.listen(3000, () => console.log(`listning to port`))
    }catch(error){
        console.log(`DB Error:${error.message}`)
        process.exit(1);
    }
}

initilizeServerWithDb()


/// get No of products

app.get('/count', async(req,res) =>{
    try{
        const query = `
        SELECT MAX(productId) AS productsSuffix
        FROM products
        `

        const dbResponse = await db.get(query);
        res.send(dbResponse)
    }catch(e){
        res.status(400);
        res.send(e.message)
    }
   
})


/// Add product

app.post('/products', async(req,res) =>{
    const product= req.body;
    const insertProduct = async (product) => {
        const query = `
            INSERT INTO products (
                productName,
                productBrand,
                superCategory,
                category,
                subCategory,
                noOfUnits,
                siUnit,
                unitWeight,
                netWeight,
                grossWeight,
                description,
                calories,
                fat,
                saturatedFat,
                carbs,
                fiber,
                sugar,
                protein,
                salt,
                ingredients,
                dietary,
                storage,
                origin,
                username,
                productId,
                images
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;
        const params = [
            product.product_name,
            product.product_brand,
            product.super_category,
            product.category,
            product.sub_category,
            product.no_of_units,
            product.si_units,
            product.unit_weight,
            product.net_weight,
            product.gross_weight,
            product.description,
            product.calories,
            product.fat,
            product.saturated_fat,
            product.carbs,
            product.fiber,
            product.sugar,
            product.protien,
            product.salt,
            product.ingredients,
            product.dietary,
            product.storage,
            product.origin,
            product.username,
            product.product_id,
            JSON.stringify(product.images)
        ];
    
        const dbResponse = await db.run(query, params, (err) => {
            if (err) {
                console.error('Error inserting product:', err);
            }
        });
        res.send(dbResponse)
    };
    insertProduct(product);
})


/// get products

app.get('/products', async(req,res) =>{
    try{
        const getQuery = `
            SELECT * FROM products
        `
        const dbResponse = await db.all(getQuery);
        const pro = dbResponse.map(row => ({
            ...row,
            images:JSON.parse(row.images)
        }));
        res.send(pro)
    }catch(e){
        res.status(400);
        res.send(e.message)
    }
});

/// update product
app.put('/products/update', async(req,res) =>{
    const productDetails = req.body;

    const{
        productName,
        productBrand,
        superCategory,
        category,
        subCategory,
        noOfUnits,
        siUnit,
        unitWeight,
        netWeight,
        grossWeight,
        description,
        calories,
        fat,
        saturatedFat,
        carbs,
        fiber,
        sugar,
        protein,
        salt,
        ingredients,
        dietary,
        storage,
        origin,
        productId,
        images
    } = productDetails

    const updateQuery = `
    UPDATE products
    SET
    productName = ?,
    productBrand = ?,
    superCategory = ?,
    category = ?,
    subCategory = ?,
    noOfUnits = ?,
    siUnit = ?,
    unitWeight = ?,
    netWeight = ?,
    grossWeight = ?,
    description = ?,
    calories = ?,
    fat = ?,
    saturatedFat = ?,
    carbs = ?,
    fiber = ?,
    sugar = ?,
    protein = ?,
    salt = ?,
    ingredients = ?,
    dietary = ?,
    storage = ?,
    origin = ?,
    productId = ?,
    images =?
 WHERE productId = ${productId}
`
const values = [
    productName,
    productBrand,
    superCategory,
    category,
    subCategory,
    noOfUnits,
    siUnit,
    unitWeight,
    netWeight,
    grossWeight,
    description,
    calories,
    fat,
    saturatedFat,
    carbs,
    fiber,
    sugar,
    protein,
    salt,
    ingredients,
    dietary,
    storage,
    origin,
    productId,
    JSON.stringify(images)
];

await db.run(updateQuery,values, function(err){
    if(err){
        console.log('Error updating data:', err);
        res.status(500).send('Error updating data');
    }else{
        console.log('Update successful');
        res.send(updateSuccessful)
    }
})
})

/// delete product

app.delete('/products/:productId', async(req,res) =>{
    try{
        const productId = req.params;
        const id = productId.productId
        const query = `
        DELETE FROM products
        WHERE productId=${id};`;

        await db.run(query);
        res.send("Product Removed Successfully");
    }catch(e){
        res.status(400);
        res.send(e.message)
    };
    
})

/// login user

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).send({'error':'Username and password are required.'});
            return;
        }

        // Use parameterized query to prevent SQL injection
        const selectUserQuery = `
            SELECT * 
            FROM users
            WHERE username = ?
        `;
        
        const userDetails = await db.get(selectUserQuery, [username]);
        if (!userDetails) {
            res.status(400).send({'error':'Invalid User'});
            return;
        }

        const isPasswordMatched = userDetails.password === password;
        if (!isPasswordMatched) {
            res.status(400);
            res.send({'error':'Invalid Password'})
            return;
        }

        const payload = { username: userDetails.username };
        const jwtToken = jwt.sign(payload, 'SECRET_WEB_TOKEN');
        res.send({ jwtToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

///login admin

app.post('/adminlogin', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).send({'error':'Username and password are required.'});
            return;
        }

        // Use parameterized query to prevent SQL injection
        const selectUserQuery = `
            SELECT * 
            FROM admins
            WHERE username = ?
        `;
        
        const userDetails = await db.get(selectUserQuery, [username]);
        if (!userDetails) {
            res.status(400).send({'error':'Invalid User'});
            return;
        }

        const isPasswordMatched = userDetails.password === password;
        if (!isPasswordMatched) {
            res.status(400);
            res.send({'error':'Invalid Password'})
            return;
        }

        const payload = { username: userDetails.username };
        const jwtToken = jwt.sign(payload, 'my_SECRET_WEB_TOKEN');
        res.send({ jwtToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


/// Register User

app.post('/register', async(req,res) =>{
    const { username, password } = req.body;
    try{
        const selectUserQuery = `
            SELECT * 
            FROM users
            WHERE username = ?
        `;
        
        const userDetails = await db.get(selectUserQuery, [username]);
        if(userDetails != undefined){
            res.send({message:"User Already Exists"})
        }else{
            const dbResponse = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
            if(dbResponse.lastID != undefined){
                res.status(200);
                res.send({message:"User registration successful"});
            }else{
                res.status(500);
                res.send({message:"Data base Error"});
            }
        }

    }catch(e){
        console.log(e)
    }
})

/// Get all Users 

app.get('/users', async(req,res) =>{
    try{
        const query = `
        SELECT * 
        FROM users
        `;
    const dbResposne = await db.all(query);
    res.send(dbResposne);
    }catch(e){
        res.status(400);
        res.send(e.message)
    }
})


/// Delete User

app.delete('/users/:userId', async(req,res) =>{
    try{
        const userId = req.params;
        const id = userId.userId
        const query = `
        DELETE FROM users
        WHERE userId=${id};`;

        await db.run(query);
        res.send("user Removed Successfully");
    }catch(e){
        res.status(400);
        res.send(e.message)
    };
    
})