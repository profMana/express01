
// import 
import http from "http";
import url from "url";
import fs from "fs";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import express from "express";  // @types/express
import cors from "cors"         // @types/cors
import fileUpload from "express-fileupload";  // @types/express-fileupload

// config
const PORT = process.env.PORT || 1337
dotenv.config({ path: ".env" });
const app = express();
const connectionString: any = process.env.connectionString;
const DBNAME = "5B";


// estensione dei metodi Request e Response di Express
declare global {
	namespace Express {
		interface Request {
			client : any  // ? means optional
		}
		interface Response {
			log : (err:any)=> any 
		}	
	}
}


/* ****************** Creazione ed Avvio del Server ************************ */
let server = http.createServer(app);
let paginaErrore: string = "";

server.listen(PORT, () => {
  init();
  console.log("Server in ascolto sulla porta " + PORT);
});

function init() {
    fs.readFile("./static/error.html", function(err:any, data:any) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>"
    });
	
	// definizione di un nuovo metodo per il log dell'errore
	app.response.log = function(msg:any) {
        console.log(`*********** Error ********* ${msg}`)
    }	
}


/* **************************** MIDDLEWARE ********************************* */
// 1 request log
app.use("/", (req: any, res: any, next: any) => {
  console.log(req.method + ": " + req.originalUrl);
  next();
});


// fare subito la default route finale


// 2 gestione delle risorse statiche
app.use("/", express.static("./static"));



// 3 lettura dei parametri POST
// Il limit serve per upload base64
// da express 4.16 (oggi 2022 4.18)
app.use("/", express.json({"limit":"50mb"}))
app.use("/", express.urlencoded({"limit":"50mb", "extended": true }))


// Lettura dei parametri get inviati in formato JSON
app.use(function (req, res, next) {
	let _url = url.parse(req.url, false)
	let params = _url.query || "";
	params = decodeURIComponent(params);
	try { req["query"] = JSON.parse(params)	}
	catch (error) {	}
	next();
});


// 4 log dei parametri get e post
app.use("/", (req: any, res: any, next: any) => {
  if (Object.keys(req.query).length != 0) {
	  console.log("------> Parametri GET: " + JSON.stringify(req.query));
  }
  if (Object.keys(req.body).length != 0) {
	  console.log("------> Parametri BODY: " +JSON.stringify(req.body));
  }
  next();
});

// 5 - per far sì che i json restituiti al client abbiano indentazione 4 chr
app.set("json spaces", 4)


// *********** Middleware aggiuntivi
// 6 - CORS PROBLEMS 
const WHITELIST = ["https://progetto-mana.web.app", "http://localhost:4200", 
   "http://192.168.178.105:4200", "http://localhost:8000", 
   "http://192.168.178.105:8000"]; // list of allow domain
const whitelist = ["http://localhost:1337", "https://localhost:1337", 
                   "http://192.168.137.1:8080", "https://192.168.137.1:1337"];
const corsOptions = {
    origin: function(origin:any, callback:any) {
        if (!origin) {
            return callback(null, true);
        }
        if (whitelist.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        } 
		else
            return callback(null, true);
    },
	credentials: true
};
app.use("/", cors(corsOptions) as any);


// 7 fileupload binario
app.use("/", fileUpload({
    "limits": { "fileSize": (10 * 1024 * 1024) }  // 10 M
}));
/* 7b upload formidable
app.use("/", formidable({
	encoding: 'utf-8',
	uploadDir: './static/img',
	multiples: true, // req.files will be an array of files
})) */


/* 8 - Per trasmettere i cookies in modo cifrato
const cookieParser = require('cookie-parser')
app.use("/", cookieParser()); */


/* 9 - CORS PROBLEMS relativi a socket-io
const io = require("socket.io")(server, {
    cors: {
        origin: WHITELIST,
        credentials: true
    }
}); */


// 10 apertura della connessione
app.use("/api/", function (req, res, next) {
	let connection = new MongoClient(connectionString);
    connection.connect()
	.catch((err: any) => {
		let msg = "Errore di connessione al db"
		res.status(503).send(msg).log(msg)
	}) 
	.then((client: any) => {
		req["client"]=client;
		next();
	})
})




/* ***************************** USER LISTENER ***************************** */

app.get('/api/richiesta1', function(req:any, res:any, next:any) {
    let unicorn = req.query.nome;
	if(!unicorn){
		// let err = new Error('Bad Request. Manca il parametro nome'); 
		// next(err);   // notare che next NON esegue il return
		
		let msg = "Bad Request. Manca il parametro nome"
		res.status(400).send(msg).log(msg)
		req["client"].close();
	}
	else{
		let collection = req["client"].db(DBNAME).collection("unicorns");
		collection.find({"name": unicorn} ).toArray(
			function(err:any, data:any) {
				if (err) {
					let msg = "Errore esecuzione query"
					res.status(500).send(msg).log(msg)
				} 
				else {
					res.send(data)	
				}
				req["client"].close();
			}
		);
	}
});







app.patch('/api/richiesta2', function(req:any, res:any, next:any) {
    let unicorn = req.body.nome;
    let nVampiri = req.body.nVampiri;
	if(!unicorn || !nVampiri){
		let msg = "Bad Request. Mancano i parametri nome e/o nVampiri"
		res.status(400).send(msg).log(msg)
		req["client"].close();
	} 
	else{
		let collection = req["client"].db(DBNAME).collection("unicorns");
		collection.updateOne({"name":unicorn},{"$inc":{"vampires":nVampiri}},
			function(err:any, data:any) {
				if (err) {					
					let msg = "Errore esecuzione query"
					res.status(500).send(msg).log(msg)
				} 
				else {
					res.send(data)	
				}
				req["client"].close();
			}
		)
	}
});


app.get('/api/richiestaParams/:gender/:hair', 
    function(req:any, res:any, next:any) {
		
    let gender = req.params.gender;
    let hair = req.params.hair;
	// la iF sui parametri non serve in quanto, se mancano i parametri,
	// NON entra nemmeno nella route
		let collection = req["client"].db(DBNAME).collection("unicorns");
		collection.find({"gender":gender, "hair":hair})
		.toArray(
			function(err:any, data:any) {
				if (err) {					
					let msg = "Errore esecuzione query"
					res.status(500).send(msg).log(msg)
				} 
				else {
					res.send(data)	
				}
				req["client"].close();
			}
		);
});



/* ***************************** DEFAULT ROUTE ***************************** */
app.use("/", (req: any, res: any, next: any) => {
  res.status(404);
  if (req.originalUrl.startsWith("/api/")) {
    res.send("API non disponibile");
	// chiudo la connessione inutilmente aperta dal middleware iniziale
	req["client"].close();
  } 
  else 
    res.send(paginaErrore);
});

// gestione degli errori
// Si verifica ad esempio se accedo con readFileSync ad un file inesistente
app.use(function(err:any, req:any, res:any, next:any) {	
	console.log("*************** SERVER ERROR *****************\n",  err.stack)
	res.status(500).send(err.message)
});
