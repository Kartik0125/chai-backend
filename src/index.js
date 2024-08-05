// require('dotenv').config({path:'./env'})//code ki consistency ko kharab karta hai ye syntax

import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config(
    {
        path:'./env'
    }
)

connectDB();

/*
const app = express();
( async ()=>{
    try
    {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log(error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on PORT:${process.env.PORT}`)
        })
    }
    catch(error)
    {
        console.error("Error:",error);
        throw error;
    }
})();
*/