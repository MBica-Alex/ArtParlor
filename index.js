const express= require("express");
const path= require("path");
const fs= require("fs");
const sass= require("sass");
const sharp= require("sharp");

app= express();
app.set("view engine", "ejs")

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"Resurse/scss"),
    folderCss: path.join(__dirname,"Resurse/css"),
    folderBackup: path.join(__dirname,"backup"),
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

let vect_foldere=[ "temp", "logs", "backup", "fisiere_uploadate" ]
for (let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), {recursive:true});   
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"resurse/imagini/favicon/favicon.ico"))
});


app.get(["/", "/index", "/home"], function(req, res){

    res.render("Pagini/index", {
        ip: req.ip
    });
});


app.get("/cale", function(req, res){
    console.log("Am primit o cerere GET pe /cale");
    res.send("Raspuns la <b style = 'color: red;'>cererea</b> GET pe /cale");
});

app.get("/cale2/:a/:b", function(req, res){
    res.send(parseInt(req.params.a)+parseInt(req.params.b));
});

function verificareErori() {
    let caleFisier = path.join(__dirname, "Resurse", "JSON", "erori.json");
    if (!fs.existsSync(caleFisier)) {
        console.error("Eroare JSON: Nu exista fisierul erori.json. Aplicatia se inchide.");
        process.exit();
    }
    let continut = fs.readFileSync(caleFisier, "utf8");

    let stack = [];
    let currentKeys = new Set();
    let regex = /"([^"]+)"\s*:|\{|\}/g;
    let match;
    while ((match = regex.exec(continut)) !== null) {
        if (match[0] === '{') {
            stack.push(currentKeys);
            currentKeys = new Set();
        } else if (match[0] === '}') {
            currentKeys = stack.pop();
        } else if (match[1]) {
            if (currentKeys.has(match[1])) {
                console.error(`Eroare JSON: Proprietatea '${match[1]}' este specificata de mai multe ori in acelasi obiect.`);
            }
            currentKeys.add(match[1]);
        }
    }

    let erori;
    try {
        erori = JSON.parse(continut);
    } catch (e) {
        console.error("Eroare parsare JSON:", e);
        return;
    }

    if (!erori.info_erori || !erori.cale_baza || !erori.eroare_default) {
        console.error("Eroare JSON: Lipseste una dintre proprietatile esentiale: info_erori, cale_baza, eroare_default.");
    }

    if (erori.eroare_default) {
        if (!erori.eroare_default.titlu || !erori.eroare_default.text || !erori.eroare_default.imagine) {
            console.error("Eroare JSON: Pentru eroarea default lipseste una dintre proprietatile: titlu, text sau imagine.");
        }
    }

    if (erori.cale_baza) {
        let caleFolderBaza = path.join(__dirname, erori.cale_baza);
        if (!fs.existsSync(caleFolderBaza)) {
            console.error(`Eroare JSON: Folderul specificat in "cale_baza" (${erori.cale_baza}) nu exista in sistemul de fisiere.`);
        } else {
            if (erori.eroare_default && erori.eroare_default.imagine) {
                let imgP = path.join(caleFolderBaza, erori.eroare_default.imagine);
                if (!fs.existsSync(imgP)) {
                    console.error(`Eroare JSON: Imaginea default '${erori.eroare_default.imagine}' nu exista.`);
                }
            }
            if (erori.info_erori) {
                for (let err of erori.info_erori) {
                    if (err.imagine) {
                        let imgP = path.join(caleFolderBaza, err.imagine);
                        if (!fs.existsSync(imgP)) {
                            console.error(`Eroare JSON: Imaginea '${err.imagine}' pentru identificatorul ${err.identificator} nu exista.`);
                        }
                    }
                }
            }
        }
    }

    if (erori.info_erori) {
        let cntId = {};
        for (let err of erori.info_erori) {
            if (err.identificator !== undefined) cntId[err.identificator] = (cntId[err.identificator] || 0) + 1;
        }
        for (let err of erori.info_erori) {
            if (err.identificator !== undefined && cntId[err.identificator] > 1) {
                let det = Object.assign({}, err);
                delete det.identificator;
                console.error(`Eroare JSON: Exista mai multe erori cu identificatorul ${err.identificator}. Restul proprietatilor: ${JSON.stringify(det)}`);
            }
        }
    }
}
verificareErori();

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    let erori=obGlobal.obErori=JSON.parse(continut)
    let err_default=erori.eroare_default
    err_default.imagine=path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori){
        eroare.imagine=path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator == identificator
    )
    let errDefault = obGlobal.obErori.eroare_default;
    if(eroare?.status)
        res.status(eroare.identificator)
    res.render("pagini/eroare",{
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });
}

app.get("/eroare", function(req, res)
{
    afisareEroare(res, 404, "Titlu!!!")
});

app.get("/*pagina", function(req, res){
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url)==""){
        afisareEroare(res,403);
        return;
    }
    if (path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                res.send(rezRandare);
                console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit!");