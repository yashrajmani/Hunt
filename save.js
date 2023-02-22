const mongoose = require("mongoose");
const Mytemp_one = require("./db/acoount_local");
const QRcode = require('qrcode');
const Canvas = require('canvas')
const crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config()
const env = require('./env');
const { Console } = require("console");
const argon2 = require('argon2');


mongoose.connect(env.database.host, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db1 = mongoose.connection;

const Hard = require("./db/hard");
const Medium = require("./db/medium");
const  MyModel = require("./db/account");
const Easy = require("./db/easy")

mongoose.createConnection('mongodb://localhost/account_local',{
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db2 = mongoose.connection;

const Mytemp = mongoose.model('Mytemp',Mytemp_one,'mytemp', db2);

function generateCode() {
    return crypto.randomBytes(4).readUInt32BE(0);
  }
  
  async function createquesion(){
    
    fs.createReadStream('easy.csv')
      .pipe(csv())
      .on('data',(row)=>{
        console.log(row.point)
        const easy = new Easy({
          question: row.question,
          score: row.point,
          code : generateCode()
        });
        
        easy.save((err) => {
          if (err) {
              console.error(`Error saving document: ${err}`);
          } else {
              console.log('Document saved successfully.');
          }
        })
      })
      .on('end', () => {
        console.log('Data import complete.');
      });

    fs.createReadStream('medium.csv')
      .pipe(csv())
      .on('data',(row)=>{
        console.log(row)
        const medium = new Medium({
          question :row.question,
          score : row.point,
          code :generateCode()
        });

        medium.save((err) => {
          if (err) {
              console.error(`Error saving document: ${err}`);
          } else {
              console.log('Document saved successfully.');
          }
      });
    }).on('end', () => {
        console.log('Data import complete.');
      });

  
  fs.createReadStream('hard.csv')
    .pipe(csv())
    .on('data',(row)=>{
      const hard = new Hard({
        question : row.question,
        score : row.point,
        code :generateCode()
      });
      
      hard.save((err) => {
        if (err) {
            console.error(`Error saving document: ${err}`);
        } else {
            console.log('Document saved successfully.');
        }
    })
  })
    .on('end', () => {
      console.log('Data import complete.');
    });

  }
  
  async function createaccount(){

    for(let i=1;i<=80;i++)
    {
      const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
    
      const hash = await argon2.hash(`${randomNum}${env.stat.static_string}`);


     const team = Mytemp({
      name: "Team" + i,
      password : randomNum,
     })

      const team_one = MyModel({
        name: "Team" + i,
        arr : [],
        password : hash,
      })
  
      try {
        await team.save();
        await team_one.save();
        console.log(`Saved Team ${i} documents`);
      } catch (error) {
        console.log(`Error saving Team ${i} documents: ${error}`);
      }

    }
 
  }
  

async function assigncode() {
  let easy = await Easy.find();
  let medium = await Medium.find();
  let hard = await Hard.find();
  let accounts = await MyModel.find();

  let index_easy = 0;
  let index_med = 0;
  let index_hard = 0;

  for (let i = 0; i < accounts.length; i++) {
    let counter = 0;

    for (let j = 0; j < 2; j++) {
      if (counter < 10 && easy[index_easy]) {
        accounts[i].arr.push(easy[index_easy].code);
        counter++;

        if(index_easy!=easy.length-1)
        {
          index_easy++;
        }
        else
        {
          index_easy = 0;
        }
      }
    }

    for (let j = 0; j < 6; j++) {
      if (counter < 10 && medium[index_med]) {
        accounts[i].arr.push(medium[index_med].code);
        counter++;

        if(index_med!=medium.length-1)
        {
          index_med++;
        }
        else
        {
          index_med = 0;
        }
      }
    }

    for (let j = 0; j < 2; j++) {
      if (counter < 10 && hard[index_hard]) {
        accounts[i].arr.push(hard[index_hard].code);
        counter++;

        if(index_hard!=hard.length-1)
        {
          index_hard++;
        }
        else
        {
          index_hard = 0;
        }
      }
    }

    await accounts[i].save();
  }
}
 
  
  

async function qrcode() {
    try {
      const easyDocs = await Easy.find().exec();
      const mediumDocs = await Medium.find().exec();
      const hardDocs = await Hard.find().exec();
  
      const tasks = [];
  
      const size = 500;
      const scale = 5;
      const textMargin = 10;
      
      for (let i = 0; i < easyDocs.length; i++) {
        const result = easyDocs[i];
        const data = result.code;
        const label = `Q ${i+1}`;
        const filePath = `C:\\VIT\\Hunt_Second\\images\\Easy\\Q ${i+1}.png`;
      
        const dataURL = await QRcode.toDataURL(data, {
          width: size,
          height: size,
          margin: 0,
          errorCorrectionLevel: 'H'
        });
      
        const img = new Canvas.Image();
        img.src = dataURL;
      
        const canvas = Canvas.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
      
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(label, size/2, size-textMargin);
      
        const buffer = canvas.toBuffer('image/png', { scale });
        const task = fs.promises.writeFile(filePath, buffer).then(() => {
          console.log(`QR code saved as ${label}`);
        });
        tasks.push(task);
      }
  
      
      for (let i = 0; i < mediumDocs.length; i++) {
        const result = mediumDocs[i];
        const data = result.code;
        const label = `Q ${i+1}`;
        const filePath = `C:\\VIT\\Hunt_Second\\images\\Medium\\Q ${i+1}.png`;
      
        const dataURL = await QRcode.toDataURL(data, {
          width: size,
          height: size,
          margin: 0,
          errorCorrectionLevel: 'H'
        });
      
        const img = new Canvas.Image();
        img.src = dataURL;
      
        const canvas = Canvas.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
      
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(label, size/2, size-textMargin);
      
        const buffer = canvas.toBuffer('image/png', { scale });
        const task = fs.promises.writeFile(filePath, buffer).then(() => {
          console.log(`QR code saved as ${label}`);
        });

        
      for (let i = 0; i < hardDocs.length; i++) {
        const result = hardDocs[i];
        const data = result.code;
        const label = `Q ${i+1}`;
        const filePath = `C:\\VIT\\Hunt_Second\\images\\Hard\\Q ${i+1}.png`;
      
        const dataURL = await QRcode.toDataURL(data, {
          width: size,
          height: size,
          margin: 0,
          errorCorrectionLevel: 'H'
        });
      
        const img = new Canvas.Image();
        img.src = dataURL;
      
        const canvas = Canvas.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
      
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(label, size/2, size-textMargin);
      
        const buffer = canvas.toBuffer('image/png', { scale });
        const task = fs.promises.writeFile(filePath, buffer).then(() => {
          console.log(`QR code saved as ${label}`);
        });
        tasks.push(task);
      }
  
        tasks.push(task);
      }
  
    await Promise.all(tasks);
  } catch (error) {
    console.error(error);
  }
}
 
  
    

  async function main() {
  
    await createquesion();
    await createaccount();
    await assigncode();
    await qrcode();
 
    
    

  }
  
main()
  
